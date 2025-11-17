import { env } from "../config/env.js";
import { getGenerativeModel } from "../utils/gemini.js";
import { buildEmbeddingText } from "./embedding-text.service.js";
import { buildComparisonTable } from "./product-compare.service.js";
import { generateEmbeddingVector } from "./embedding.service.js";
import { searchSimilarProductsByEmbedding } from "./product-embedding.service.js";

export async function answerProductQuery({ query, topK = env.VECTOR_TOP_K, minScore = 0.4 }) {
	if (!query) {
		throw new Error("query is required");
	}

	const queryEmbedding = await generateEmbeddingVector(query);
	const matches = await searchSimilarProductsByEmbedding(queryEmbedding, { topK, minScore });
	const enrichedMatches = matches.filter((match) => !!match.product);

	const contextBlocks = enrichedMatches
		.map((match, index) => {
			const normalized = match.product;
			const template = buildEmbeddingText(normalized);
			return `## Sản phẩm #${index + 1}
${template}
JSON: ${JSON.stringify(normalized)}`;
		})
		.join("\n\n");

	const systemPrompt = `Bạn là trợ lý mua sắm chuyên gia của TPE Store. 
- Luôn dựa hoàn toàn vào dữ liệu cung cấp.
- Trả lời ngắn gọn, ưu tiên tiếng Việt, đưa ra lý do rõ ràng.
- Nếu thiếu thông tin, hãy nêu rõ.`;

	const userPrompt = `Câu hỏi khách hàng: "${query}"

DANH SÁCH SẢN PHẨM LIÊN QUAN:
${contextBlocks || "Không có dữ liệu."}

Trả lời thân thiện, có thể đề xuất thêm sản phẩm nếu phù hợp.`;

	const model = getGenerativeModel(env.GEMINI_RAG_MODEL);
	const response = await model.generateContent({
		contents: [
			{ role: "system", parts: [{ text: systemPrompt }] },
			{ role: "user", parts: [{ text: userPrompt }] },
		],
		generationConfig: {
			temperature: 0.4,
			topP: 0.95,
			maxOutputTokens: 1024,
		},
	});

	const answer = response?.response?.text() || "";
	const comparison = buildComparisonTable(enrichedMatches.map((match) => match.product));

	return {
		answer,
		products: enrichedMatches.map((match) => ({
			productId: match.productId,
			score: match.score,
			data: match.product,
		})),
		comparison,
	};
}

