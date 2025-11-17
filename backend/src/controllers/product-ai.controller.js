import {
	embedProductById,
	rebuildAllProductEmbeddings,
	searchSimilarProductsByText,
} from "../services/product-embedding.service.js";
import { answerProductQuery } from "../services/product-rag.service.js";
import { handleProductAssistant } from "../services/product-assistant.service.js";

export async function rebuildEmbeddings(req, res) {
	try {
		const { productIds = [], batchSize = 50, concurrency = 4 } = req.body || {};
		const normalizedIds = Array.isArray(productIds) ? productIds : [];
		const result = await rebuildAllProductEmbeddings({ productIds: normalizedIds, batchSize, concurrency });
		res.json({ message: "Rebuild completed", ...result });
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

export async function queryProductRag(req, res) {
	try {
		const { query, topK, minScore } = req.body || {};
		if (!query) {
			return res.status(400).json({ error: "query is required" });
		}
		const result = await answerProductQuery({ query, topK, minScore });
		res.json(result);
	} catch (error) {
		console.error("[AI] queryProductRag error:", error);
		res.status(500).json({ error: error.message });
	}
}

export async function semanticSearch(req, res) {
	try {
		const { text, topK, minScore } = req.body || {};
		if (!text) {
			return res.status(400).json({ error: "text is required" });
		}
		const results = await searchSimilarProductsByText(text, { topK, minScore });
		res.json({ items: results });
	} catch (error) {
		console.error("[AI] semanticSearch error:", error);
		res.status(500).json({ error: error.message });
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

