import { env } from "../config/env.js";
import { getGenerativeModel, withGeminiRetry } from "../utils/gemini.js";
import { buildEmbeddingText } from "./embedding-text.service.js";
import { buildComparisonTable } from "./product-compare.service.js";
import { generateEmbeddingVector } from "./embedding.service.js";
import { searchSimilarProductsByEmbedding } from "./product-embedding.service.js";

export async function answerProductQuery({ query, topK = env.VECTOR_TOP_K, minScore = 0.3 }) {
	if (!query) {
		throw new Error("query is required");
	}

	let queryEmbedding;
	try {
		queryEmbedding = await generateEmbeddingVector(query);
	} catch (error) {
		console.error("[AI] Failed to generate embedding for RAG query:", error);
		if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("429")) {
			throw new Error("Quota embedding đã hết. Vui lòng kiểm tra Gemini API key hoặc đợi một chút rồi thử lại.");
		}
		throw error;
	}
	
	// Use lower minScore for initial search, then re-rank
	const initialMinScore = Math.max(0.1, minScore * 0.6);
	
	// Get more candidates initially for re-ranking
	const matches = await searchSimilarProductsByEmbedding(queryEmbedding, { topK: topK * 2, minScore: initialMinScore });
	const enrichedMatches = matches.filter((match) => !!match.product);
	
	if (enrichedMatches.length === 0) {
		console.warn("[AI] No products found for RAG query, returning empty result");
		// Return empty but valid response instead of failing
		return {
			answer: "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa khác hoặc mở rộng tiêu chí tìm kiếm.",
			products: [],
			comparison: null,
		};
	}
	
	// Re-rank based on spec matching
	const reranked = rerankBySpecMatch(enrichedMatches, query);
	const topMatches = reranked.slice(0, topK);

	const contextBlocks = topMatches
		.map((match, index) => {
			const normalized = match.product;
			const template = buildEmbeddingText(normalized);
			return `## Sản phẩm #${index + 1}
${template}
JSON: ${JSON.stringify(normalized)}`;
		})
		.filter(Boolean);
	const optimizedContext = summarize_context_for_llm(contextBlocks);

	const instructions = `Bạn là trợ lý mua sắm chuyên gia của TPE Store.
- Luôn dựa hoàn toàn vào dữ liệu cung cấp.
- Trả lời ngắn gọn, ưu tiên tiếng Việt, đưa ra lý do rõ ràng.
- Nếu thiếu thông tin, hãy nêu rõ.`;

	const prompt = `${instructions}

Câu hỏi khách hàng: "${query}"

DANH SÁCH SẢN PHẨM LIÊN QUAN:
${optimizedContext || "Không có dữ liệu."}

Trả lời thân thiện, có thể đề xuất thêm sản phẩm nếu phù hợp.`;

	const model = getGenerativeModel(env.GEMINI_RAG_MODEL);
	const response = await withGeminiRetry(() =>
		model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			generationConfig: {
				temperature: 0.4,
				topP: 0.95,
				maxOutputTokens: 1024,
			},
		}),
	);

	const answer = response?.response?.text() || "";
	const comparison = buildComparisonTable(topMatches.map((match) => match.product));

	return {
		answer,
		products: topMatches.map((match) => ({
			productId: match.productId,
			score: match.score,
			data: match.product,
		})),
		comparison,
	};
}

function rerankBySpecMatch(matches, query) {
	// Extract potential spec keywords from query
	const queryLower = query.toLowerCase();
	const specKeywords = {
		ram: ["ram", "bộ nhớ ram", "memory"],
		storage: ["storage", "rom", "dung lượng", "ổ cứng", "ssd", "hdd"],
		chip: ["chip", "cpu", "processor", "vi xử lý"],
		display: ["màn hình", "display", "screen", "inch"],
		refresh: ["refresh", "tần số quét", "hz", "fps"],
		brand: ["apple", "samsung", "asus", "lenovo", "hp", "dell", "acer", "msi"],
	};
	
	// Category keywords mapping
	const categoryKeywords = {
		"điện thoại": ["điện thoại", "smartphone", "phone", "mobile"],
		"laptop": ["laptop", "máy tính xách tay", "notebook"],
		"màn hình máy tính": ["màn hình", "monitor", "screen", "display"],
		"tablet": ["tablet", "máy tính bảng"],
		"phụ kiện": ["phụ kiện", "accessories"],
	};
	
	// Detect category from query
	const detectedCategory = Object.entries(categoryKeywords).find(([category, keywords]) =>
		keywords.some((kw) => queryLower.includes(kw))
	)?.[0];
	
	return matches.map((match) => {
		let specBoost = 0;
		const product = match.product;
		const specs = product.specs || [];
		const specText = specs.map((s) => `${s.fieldName} ${s.value}`).join(" ").toLowerCase();
		const categoryName = (product.categoryName || "").toLowerCase();
		
		// Strong boost for category match (most important)
		if (detectedCategory && categoryName.includes(detectedCategory.toLowerCase())) {
			specBoost += 0.5; // Very strong boost for category match
		} else if (detectedCategory) {
			// Penalize if category doesn't match
			specBoost -= 0.3;
		}
		
		// Check if query mentions specs that exist in product
		for (const [key, keywords] of Object.entries(specKeywords)) {
			if (keywords.some((kw) => queryLower.includes(kw))) {
				if (specText.includes(keywords.find((kw) => queryLower.includes(kw)) || "")) {
					specBoost += 0.15; // Boost score if spec matches
				}
			}
		}
		
		// Check for exact number matches (RAM, storage, etc.)
		const numberMatches = queryLower.match(/(\d+)\s*(gb|tb|inch|hz)/gi);
		if (numberMatches) {
			numberMatches.forEach((match) => {
				if (specText.includes(match.toLowerCase())) {
					specBoost += 0.2; // Strong boost for exact number match
				}
			});
		}
		
		return {
			...match,
			score: Math.max(0, match.score + specBoost), // Boost original similarity score, ensure non-negative
		};
	}).sort((a, b) => b.score - a.score); // Re-sort by boosted score
}

function summarize_context_for_llm(contextList, { maxChars = 4000 } = {}) {
	if (!Array.isArray(contextList) || !contextList.length) {
		return "";
	}

	const joined = contextList.join("\n\n");
	if (joined.length <= maxChars) {
		return joined;
	}

	// Priority: Keep specs section intact, trim description if needed
	const perBlockChars = Math.max(300, Math.floor(maxChars / contextList.length));
	const condensed = contextList.map((block) => {
		if (!block) return "";
		if (block.length <= perBlockChars) return block;
		
		// Try to preserve specs section (between "--- THÔNG SỐ KỸ THUẬT ---" and end)
		const specsMarker = "--- THÔNG SỐ KỸ THUẬT ---";
		const specsIndex = block.indexOf(specsMarker);
		
		if (specsIndex > 0) {
			const beforeSpecs = block.slice(0, specsIndex);
			const specsSection = block.slice(specsIndex);
			
			// Trim description but keep full specs
			const trimmedBefore = beforeSpecs.length > perBlockChars * 0.6 
				? beforeSpecs.slice(0, Math.floor(perBlockChars * 0.6)) + "\n... (mô tả đã rút gọn)"
				: beforeSpecs;
			
			return trimmedBefore + "\n" + specsSection;
		}
		
		// Fallback: trim evenly
		return `${block.slice(0, perBlockChars)}\n... (đã rút gọn)`;
	});

	const optimized = condensed.join("\n\n");
	return optimized.length > maxChars ? optimized.slice(0, maxChars) + "\n... (đã tóm tắt)" : optimized;
}

