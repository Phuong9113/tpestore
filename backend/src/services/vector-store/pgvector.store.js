import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { env } from "../../config/env.js";

export async function upsertEmbedding({ productId, embedding, rawText, jsonData }) {
	if (!productId) {
		throw new Error("productId is required for pgvector upsert");
	}

	await prisma.productEmbedding.upsert({
		where: { productId },
		update: {
			embedding,
			rawText,
			jsonData,
		},
		create: {
			productId,
			embedding,
			rawText,
			jsonData,
		},
	});

	return { productId, provider: "pgvector" };
}

export async function similaritySearch({ embedding, limit = env.VECTOR_TOP_K, minScore = 0 }) {
	if (!Array.isArray(embedding) || !embedding.length) {
		throw new Error("Embedding vector is required for similarity search");
	}

	const vector = toPgVectorLiteral(embedding);

	const rows = await prisma.$queryRaw`
		SELECT "productId", "rawText", "jsonData", 1 - ("embedding" <=> ${vector}) AS similarity
		FROM "ProductEmbedding"
		ORDER BY "embedding" <=> ${vector}
		LIMIT ${limit};
	`;

	return rows
		.map((row) => ({
			productId: row.productId,
			rawText: row.rawText,
			jsonData: row.jsonData,
			score: Number(row.similarity) || 0,
		}))
		.filter((row) => row.score >= minScore);
}

function toPgVectorLiteral(values) {
	const sanitized = values.map((value) => {
		const num = Number(value);
		return Number.isFinite(num) ? num : 0;
	});

	return Prisma.sql`ARRAY[${Prisma.join(sanitized)}]::vector`;
}

