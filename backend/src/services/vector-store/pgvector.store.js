import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { env } from "../../config/env.js";

export async function upsertEmbedding({ productId, embedding, rawText, jsonData }) {
	if (!productId) {
		throw new Error("productId is required for pgvector upsert");
	}

	// Convert embedding array to PostgreSQL vector format string
	const vectorStr = `[${embedding.map(v => Number(v).toFixed(6)).join(",")}]`;
	const jsonDataStr = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);

	// Generate a simple unique ID (cuid-like but simpler for this use case)
	// Format: PEM + timestamp + random
	const generateSimpleId = () => {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 8);
		return `PEM${timestamp}${random}`;
	};

	// Use ON CONFLICT to handle both insert and update
	// First, try to get existing ID, if not exists, generate new one
	const existing = await prisma.$queryRaw`
		SELECT "id" FROM "ProductEmbedding" WHERE "productId" = ${productId} LIMIT 1;
	`;

	let recordId;
	if (existing && existing.length > 0) {
		recordId = existing[0].id;
	} else {
		recordId = generateSimpleId();
	}

	// Use ON CONFLICT to handle upsert
	await prisma.$executeRawUnsafe(`
		INSERT INTO "ProductEmbedding" ("id", "productId", "embedding", "rawText", "jsonData", "createdAt", "updatedAt")
		VALUES ($1, $2, $3::vector, $4, $5::jsonb, NOW(), NOW())
		ON CONFLICT ("productId")
		DO UPDATE SET
			"embedding" = $3::vector,
			"rawText" = $4,
			"jsonData" = $5::jsonb,
			"updatedAt" = NOW();
	`, recordId, productId, vectorStr, rawText, jsonDataStr);

	return { productId, provider: "pgvector" };
}

export async function similaritySearch({ embedding, limit = env.VECTOR_TOP_K, minScore = 0 }) {
	if (!Array.isArray(embedding) || !embedding.length) {
		throw new Error("Embedding vector is required for similarity search");
	}

	// First check if we have any embeddings at all
	const countResult = await prisma.$queryRaw`
		SELECT COUNT(*)::int AS count FROM "ProductEmbedding";
	`;
	const totalEmbeddings = countResult[0]?.count || 0;
	
	console.log(`[AI] Total embeddings in DB: ${totalEmbeddings}`);
	
	if (totalEmbeddings === 0) {
		console.warn("[AI] No embeddings found in database. Please run rebuild embeddings first.");
		return [];
	}

	const vector = toPgVectorLiteral(embedding);

	// Get more results than requested to see actual scores
	const rows = await prisma.$queryRaw`
		SELECT "productId", "rawText", "jsonData", 1 - ("embedding" <=> ${vector}) AS similarity
		FROM "ProductEmbedding"
		ORDER BY "embedding" <=> ${vector}
		LIMIT ${limit * 3};
	`;

	console.log(`[AI] Raw vector search returned ${rows.length} rows (before minScore filter)`);
	if (rows.length > 0) {
		const topScores = rows.slice(0, 5).map(r => Number(r.similarity) || 0);
		console.log(`[AI] Top 5 similarity scores:`, topScores.map(s => s.toFixed(4)).join(', '));
	}

	const filtered = rows
		.map((row) => ({
			productId: row.productId,
			rawText: row.rawText,
			jsonData: row.jsonData,
			score: Number(row.similarity) || 0,
		}))
		.filter((row) => row.score >= minScore);

	return filtered;
}

function toPgVectorLiteral(values) {
	const sanitized = values.map((value) => {
		const num = Number(value);
		return Number.isFinite(num) ? num : 0;
	});

	return Prisma.sql`ARRAY[${Prisma.join(sanitized)}]::vector`;
}

