import { env } from "../../config/env.js";

function ensureConfig() {
	if (!env.PINECONE_API_KEY || !env.PINECONE_INDEX_HOST) {
		throw new Error("Pinecone is not configured. Please set PINECONE_API_KEY and PINECONE_INDEX_HOST");
	}
}

function pineconeHeaders() {
	return {
		"Content-Type": "application/json",
		"Api-Key": env.PINECONE_API_KEY,
	};
}

async function pineconeFetch(path, payload) {
	ensureConfig();
	const url = `https://${env.PINECONE_INDEX_HOST}${path}`;
	const response = await fetch(url, {
		method: "POST",
		headers: pineconeHeaders(),
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Pinecone error (${response.status}): ${errorText}`);
	}

	return response.json();
}

export async function upsertEmbedding({ productId, embedding, rawText, jsonData }) {
	if (!productId) {
		throw new Error("productId is required for Pinecone upsert");
	}

	await pineconeFetch("/vectors/upsert", {
		vectors: [
			{
				id: productId,
				values: embedding,
				metadata: {
					rawText,
					jsonData,
				},
			},
		],
		namespace: env.PINECONE_NAMESPACE,
	});

	return { productId, provider: "pinecone" };
}

export async function similaritySearch({ embedding, limit = env.VECTOR_TOP_K, minScore = 0 }) {
	const result = await pineconeFetch("/query", {
		vector: embedding,
		topK: limit,
		includeMetadata: true,
		namespace: env.PINECONE_NAMESPACE,
	});

	return (result.matches || [])
		.map((match) => ({
			productId: match.id,
			rawText: match.metadata?.rawText || "",
			jsonData: parseMaybeJson(match.metadata?.jsonData),
			score: Number(match.score) || 0,
		}))
		.filter((match) => match.score >= minScore);
}

function parseMaybeJson(payload) {
	if (!payload) return null;
	if (typeof payload === "object") return payload;
	try {
		return JSON.parse(payload);
	} catch (_) {
		return null;
	}
}

