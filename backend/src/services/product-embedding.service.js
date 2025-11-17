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
				const product = queue.shift();
				if (!product) break;
				try {
					const output = await processProductEmbedding(product);
					successes.push({ productId: product.id, output });
				} catch (error) {
					const errorMessage = error.message || String(error);
					const errorStatus = error.status || error.code;
					
					// Log first few errors for debugging
					if (failures.length < 5) {
						console.error(`[AI] Failed to embed product ${product.id}:`, errorMessage, errorStatus ? `(status: ${errorStatus})` : '');
					}
					
					failures.push({ 
						productId: product.id, 
						error: errorMessage,
						status: errorStatus,
						// Include more details for quota errors
						isQuotaError: errorStatus === 429 || errorMessage.includes("quota") || errorMessage.includes("429")
					});
				}
			}
		});

		await Promise.all(workers);
	}

	// Check if all failures are quota errors
	const quotaErrors = failures.filter(f => f.isQuotaError).length;
	if (quotaErrors > 0 && quotaErrors === failures.length) {
		console.error(`[AI] All ${quotaErrors} failures are due to quota limits. Please check Gemini API key or wait for quota reset.`);
	}

	return {
		total,
		success: successes.length,
		failures: failures.slice(0, 20), // Limit to first 20 failures to avoid huge response
		failureCount: failures.length,
		quotaErrorCount: quotaErrors,
	};
}

export async function searchSimilarProductsByEmbedding(queryEmbedding, { topK, minScore = 0 } = {}) {
	const matches = await vectorSimilaritySearch({
		embedding: queryEmbedding,
		limit: topK,
		minScore,
	});

	console.log(`[AI] Vector search returned ${matches.length} raw matches (minScore: ${minScore})`);
	if (matches.length > 0) {
		console.log(`[AI] Top match score: ${matches[0]?.score?.toFixed(4) || 'N/A'}`);
	}

	return hydrateMatches(matches);
}

export async function searchSimilarProductsByText(query, options) {
	try {
		const embedding = await generateEmbeddingVector(query);
		const results = await searchSimilarProductsByEmbedding(embedding, options);
		
		// Post-filter by category if query mentions category
		const queryLower = query.toLowerCase();
		const categoryKeywords = {
			"điện thoại": ["điện thoại", "smartphone", "phone", "mobile"],
			"laptop": ["laptop", "máy tính xách tay", "notebook"],
			"màn hình máy tính": ["màn hình", "monitor", "screen", "display"],
			"tablet": ["tablet", "máy tính bảng"],
		};
		
		const detectedCategory = Object.entries(categoryKeywords).find(([category, keywords]) =>
			keywords.some((kw) => queryLower.includes(kw))
		)?.[0];
		
		if (detectedCategory && results.length > 0) {
			// Filter and boost category matches
			const categoryMatches = results.filter((r) => 
				r.product?.categoryName?.toLowerCase().includes(detectedCategory.toLowerCase())
			);
			
			if (categoryMatches.length > 0) {
				// If we have category matches, prioritize them
				const otherMatches = results.filter((r) => 
					!r.product?.categoryName?.toLowerCase().includes(detectedCategory.toLowerCase())
				);
				// Return category matches first, then others
				return [...categoryMatches, ...otherMatches].slice(0, options?.topK || 5);
			}
		}
		
		return results;
	} catch (error) {
		console.error("[AI] Failed to generate embedding for query:", error);
		
		// Check if it's a quota/rate limit error
		if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("429")) {
			throw new Error("Quota embedding đã hết. Vui lòng kiểm tra Gemini API key hoặc đợi một chút rồi thử lại.");
		}
		
		throw error;
	}
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

