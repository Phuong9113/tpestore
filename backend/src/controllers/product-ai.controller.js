import {
	embedProductById,
	rebuildAllProductEmbeddings,
	searchSimilarProductsByText,
} from "../services/product-embedding.service.js";
import { answerProductQuery } from "../services/product-rag.service.js";
import { handleProductAssistant } from "../services/product-assistant.service.js";
import prisma from "../utils/prisma.js";

export async function rebuildEmbeddings(req, res) {
	try {
		const { productIds = [], batchSize = 50, concurrency = 4 } = req.body || {};
		const normalizedIds = Array.isArray(productIds) ? productIds : [];
		
		console.log(`[AI] Starting rebuild embeddings: ${normalizedIds.length || 'all'} products, batchSize=${batchSize}, concurrency=${concurrency}`);
		
		const result = await rebuildAllProductEmbeddings({ productIds: normalizedIds, batchSize, concurrency });
		
		console.log(`[AI] Rebuild completed: ${result.success} success, ${result.failureCount} failures`);
		
		// Provide more helpful message
		let message = `Rebuild completed: ${result.success} thành công`;
		if (result.failureCount > 0) {
			if (result.quotaErrorCount === result.failureCount) {
				message += `, ${result.failureCount} lỗi do quota embedding đã hết. Vui lòng kiểm tra Gemini API key hoặc đợi quota reset.`;
			} else {
				message += `, ${result.failureCount} lỗi. Kiểm tra logs để biết chi tiết.`;
			}
		}
		
		res.json({ message, ...result });
	} catch (error) {
		console.error("[AI] rebuildEmbeddings error:", error);
		res.status(500).json({ error: error.message });
	}
}

export async function embedProduct(req, res) {
	try {
		const { productId } = req.params;
		const result = await embedProductById(productId);
		res.json({ message: "Embedding updated", result });
	} catch (error) {
		console.error("[AI] embedProduct error:", error);
		res.status(500).json({ error: error.message });
	}
}

export async function checkEmbeddingsStatus(req, res) {
	try {
		const { getVectorStoreProvider } = await import("../services/vector-store/index.js");
		const provider = getVectorStoreProvider();
		
		// Check total embeddings count
		const countResult = await prisma.$queryRaw`
			SELECT COUNT(*)::int AS count FROM "ProductEmbedding";
		`;
		const totalEmbeddings = countResult[0]?.count || 0;
		
		// Check total products
		const totalProducts = await prisma.product.count();
		
		// Check recent embeddings (last 24 hours)
		const recentCount = await prisma.productEmbedding.count({
			where: {
				updatedAt: {
					gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
				},
			},
		});
		
		res.json({
			provider,
			totalProducts,
			totalEmbeddings,
			recentEmbeddings: recentCount,
			coverage: totalProducts > 0 ? ((totalEmbeddings / totalProducts) * 100).toFixed(1) + "%" : "0%",
			needsRebuild: totalEmbeddings === 0,
		});
	} catch (error) {
		console.error("[AI] checkEmbeddingsStatus error:", error);
		res.status(500).json({ error: error.message });
	}
}

export async function queryProductRag(req, res) {
	try {
		const { query, topK, minScore } = req.body || {};
		if (!query) {
			return res.status(400).json({ error: "query is required" });
		}
		
		console.log("[AI] queryProductRag called with:", { query: query.substring(0, 50), topK, minScore });
		
		const result = await answerProductQuery({ query, topK, minScore });
		
		console.log(`[AI] queryProductRag returned answer (${result.answer?.length || 0} chars) and ${result.products?.length || 0} products`);
		
		res.json(result);
	} catch (error) {
		console.error("[AI] queryProductRag error:", error);
		
		// Provide more detailed error message
		let errorMessage = error.message || "Unknown error";
		if (error.status === 429) {
			errorMessage = "Quota embedding hoặc Gemini API đã hết. Vui lòng kiểm tra API key hoặc đợi một chút rồi thử lại.";
		} else if (error.message?.includes("embedding")) {
			errorMessage = `Lỗi tạo embedding: ${error.message}`;
		} else if (error.message?.includes("503")) {
			errorMessage = "Gemini API đang quá tải. Vui lòng thử lại sau vài giây.";
		}
		
		res.status(error.status || 500).json({ 
			error: errorMessage,
			details: process.env.NODE_ENV === "development" ? error.stack : undefined
		});
	}
}

export async function semanticSearch(req, res) {
	try {
		const { text, topK, minScore } = req.body || {};
		if (!text) {
			return res.status(400).json({ error: "text is required" });
		}
		
		// Use lower default minScore if not provided (0.2 instead of 0.35)
		const effectiveMinScore = minScore !== undefined ? minScore : 0.2;
		
		console.log("[AI] semanticSearch called with:", { text: text.substring(0, 50), topK, minScore: effectiveMinScore });
		
		const results = await searchSimilarProductsByText(text, { topK, minScore: effectiveMinScore });
		
		console.log(`[AI] semanticSearch returned ${results.length} results`);
		
		// If no results, try with even lower threshold
		if (results.length === 0 && effectiveMinScore > 0.1) {
			console.log("[AI] No results with current threshold, trying with lower minScore (0.1)");
			const relaxedResults = await searchSimilarProductsByText(text, { topK, minScore: 0.1 });
			if (relaxedResults.length > 0) {
				console.log(`[AI] Found ${relaxedResults.length} results with relaxed threshold`);
				return res.json({ items: relaxedResults, note: "Kết quả với ngưỡng tương đồng thấp hơn" });
			}
		}
		
		res.json({ items: results });
	} catch (error) {
		console.error("[AI] semanticSearch error:", error);
		
		// Provide more detailed error message
		let errorMessage = error.message || "Unknown error";
		if (error.status === 429) {
			errorMessage = "Quota embedding đã hết. Vui lòng kiểm tra Gemini API key hoặc đợi một chút rồi thử lại.";
		} else if (error.message?.includes("embedding")) {
			errorMessage = `Lỗi tạo embedding: ${error.message}`;
		}
		
		res.status(error.status || 500).json({ 
			error: errorMessage,
			details: process.env.NODE_ENV === "development" ? error.stack : undefined
		});
	}
}

export async function productAssistant(req, res) {
	try {
		const { message, history } = req.body || {};
		if (!message) {
			return res.status(400).json({ error: "message is required" });
		}
		const result = await handleProductAssistant({ message, history });
		res.json(result);
	} catch (error) {
		console.error("[AI] productAssistant error:", error);
		res.status(500).json({ error: error.message });
	}
}

