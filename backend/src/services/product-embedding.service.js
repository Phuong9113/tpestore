import prisma from "../utils/prisma.js";
import { fetchProductsForEmbedding, normalizeProductRecord } from "./product-normalizer.service.js";
import { buildEmbeddingText } from "./embedding-text.service.js";
import { generateEmbeddingVector } from "./embedding.service.js";
import { similaritySearch as vectorSimilaritySearch, upsertEmbedding as vectorUpsert } from "./vector-store/index.js";

export async function embedProductById(productId) {
	const product = await prisma.product.findUnique({
		where: { id: productId },
		include: {
			category: true,
			specs: {
				include: { specField: true },
			},
		},
	});

	if (!product) {
		throw new Error(`Product ${productId} not found`);
	}

	return processProductEmbedding(product);
}

export async function rebuildAllProductEmbeddings({ productIds = [], batchSize = 50, concurrency = 4 } = {}) {
	let skip = 0;
	let total = 0;
	const successes = [];
	const failures = [];

	while (true) {
		const chunk = await fetchProductsForEmbedding({ productIds, skip, take: batchSize * concurrency });
		if (!chunk.length) break;
		total += chunk.length;
		skip += chunk.length;

		const queue = [...chunk];
		const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
			while (queue.length) {
				const batch = queue.splice(0, batchSize);
				await Promise.all(
					batch.map(async (product) => {
						try {
							const output = await processProductEmbedding(product);
							successes.push({ productId: product.id, output });
						} catch (error) {
							failures.push({ productId: product.id, error: error.message });
						}
					}),
				);
			}
		});

		await Promise.all(workers);
	}

	return {
		total,
		success: successes.length,
		failures,
	};
}

export async function searchSimilarProductsByEmbedding(queryEmbedding, { topK, minScore = 0 } = {}) {
	const matches = await vectorSimilaritySearch({
		embedding: queryEmbedding,
		limit: topK,
		minScore,
	});

	return hydrateMatches(matches);
}

export async function searchSimilarProductsByText(query, options) {
	const embedding = await generateEmbeddingVector(query);
	return searchSimilarProductsByEmbedding(embedding, options);
}

async function processProductEmbedding(product) {
	const normalized = normalizeProductRecord(product);
	const rawText = buildEmbeddingText(normalized);
	const embedding = await generateEmbeddingVector(rawText);

	await vectorUpsert({
		productId: normalized.productId,
		embedding,
		rawText,
		jsonData: normalized,
	});

	return { productId: normalized.productId, normalized };
}

async function hydrateMatches(matches = []) {
	const ids = matches.map((match) => match.productId).filter(Boolean);
	if (!ids.length) return [];

	const products = await prisma.product.findMany({
		where: { id: { in: ids } },
		include: {
			category: true,
			specs: {
				include: { specField: true },
			},
		},
	});
	const normalizedMap = new Map(products.map((product) => [product.id, normalizeProductRecord(product)]));

	return matches.map((match) => ({
		productId: match.productId,
		score: match.score,
		rawText: match.rawText,
		product: normalizedMap.get(match.productId) || parseJson(match.jsonData),
	}));
}

function parseJson(payload) {
	if (!payload) return null;
	if (typeof payload === "object") return payload;
	try {
		return JSON.parse(payload);
	} catch (error) {
		return null;
	}
}

