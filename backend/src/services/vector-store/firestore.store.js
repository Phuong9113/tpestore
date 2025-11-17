import { env } from "../../config/env.js";

function ensureConfig() {
	if (!env.FIRESTORE_PROJECT_ID) {
		throw new Error("FIRESTORE_PROJECT_ID must be configured for Firestore vector storage");
	}
}

function getBaseUrl() {
	ensureConfig();
	const base =
		env.FIRESTORE_BASE_URL?.replace(/\/$/, "") ||
		`https://firestore.googleapis.com/v1/projects/${env.FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
	return `${base}/${env.FIRESTORE_COLLECTION}`;
}

async function firestoreFetch(path, { method = "GET", body, query = "" } = {}) {
	const headers = { "Content-Type": "application/json" };
	if (env.FIRESTORE_BEARER_TOKEN) {
		headers.Authorization = `Bearer ${env.FIRESTORE_BEARER_TOKEN}`;
	}

	const apiKeySuffix = env.FIRESTORE_API_KEY ? `key=${env.FIRESTORE_API_KEY}` : "";
	const queryString = [query, apiKeySuffix].filter(Boolean).join("&");
	const url = `${getBaseUrl()}${path}${queryString ? `?${queryString}` : ""}`;

	const response = await fetch(url, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Firestore error (${response.status}): ${errorText}`);
	}

	return response.json();
}

export async function upsertEmbedding({ productId, embedding, rawText, jsonData }) {
	const fields = {
		productId: { stringValue: productId },
		rawText: { stringValue: rawText },
		jsonData: toFirestoreValue(jsonData),
		embedding: {
			arrayValue: {
				values: embedding.map((value) => ({
					doubleValue: Number(value) || 0,
				})),
			},
		},
		updatedAt: { timestampValue: new Date().toISOString() },
	};

	const updateMask = ["productId", "rawText", "jsonData", "embedding", "updatedAt"]
		.map((field) => `updateMask.fieldPaths=${field}`)
		.join("&");

	await firestoreFetch(`/${productId}`, {
		method: "PATCH",
		body: {
			name: `${getBaseUrl()}/${productId}`,
			fields,
		},
		query: updateMask,
	});

	return { productId, provider: "firestore" };
}

export async function similaritySearch({ embedding, limit = env.VECTOR_TOP_K, minScore = 0 }) {
	const documents = await firestoreFetch("", {
		query: `pageSize=${env.FIRESTORE_QUERY_LIMIT}`,
	});

	const items = (documents.documents || []).map((doc) => fromFirestoreDocument(doc, embedding));

	return items
		.filter((item) => item.score >= minScore)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
}

function fromFirestoreDocument(doc, queryVector) {
	const fields = doc.fields || {};
	const storedEmbedding = (fields.embedding?.arrayValue?.values || []).map(
		(value) => value.doubleValue ?? value.integerValue ?? 0,
	);

	return {
		productId: fields.productId?.stringValue || doc.name?.split("/").pop(),
		rawText: fields.rawText?.stringValue || "",
		jsonData: fromFirestoreValue(fields.jsonData),
		score: cosineSimilarity(queryVector, storedEmbedding),
	};
}

function cosineSimilarity(a = [], b = []) {
	if (!a.length || !b.length || a.length !== b.length) return 0;
	const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
	const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
	const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
	if (!magnitudeA || !magnitudeB) return 0;
	return dot / (magnitudeA * magnitudeB);
}

function toFirestoreValue(value) {
	if (value === null || value === undefined) {
		return { nullValue: null };
	}
	if (Array.isArray(value)) {
		return {
			arrayValue: {
				values: value.map((entry) => toFirestoreValue(entry)),
			},
		};
	}
	if (typeof value === "object") {
		const fields = Object.entries(value).reduce((acc, [key, val]) => {
			acc[key] = toFirestoreValue(val);
			return acc;
		}, {});
		return { mapValue: { fields } };
	}
	if (typeof value === "number") {
		return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
	}
	if (typeof value === "boolean") {
		return { booleanValue: value };
	}
	return { stringValue: String(value) };
}

function fromFirestoreValue(value) {
	if (!value) return null;
	if ("stringValue" in value) return value.stringValue;
	if ("integerValue" in value) return Number(value.integerValue);
	if ("doubleValue" in value) return Number(value.doubleValue);
	if ("booleanValue" in value) return Boolean(value.booleanValue);
	if ("nullValue" in value) return null;
	if ("arrayValue" in value) {
		return (value.arrayValue.values || []).map((entry) => fromFirestoreValue(entry));
	}
	if ("mapValue" in value) {
		const fields = value.mapValue.fields || {};
		return Object.entries(fields).reduce((acc, [key, val]) => {
			acc[key] = fromFirestoreValue(val);
			return acc;
		}, {});
	}
	if ("timestampValue" in value) return value.timestampValue;
	return null;
}

