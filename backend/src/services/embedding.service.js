import { env } from "../config/env.js";
import { getGenerativeModel } from "../utils/gemini.js";

let embeddingModel;

function getEmbeddingModel() {
	if (!embeddingModel) {
		embeddingModel = getGenerativeModel(env.GEMINI_EMBED_MODEL);
	}
	return embeddingModel;
}

export async function generateEmbeddingVector(text) {
	if (!text) {
		throw new Error("Text is required to generate an embedding");
	}

	const model = getEmbeddingModel();
	const result = await model.embedContent({
		content: {
			parts: [{ text }],
		},
	});

	const values = result?.embedding?.values;
	if (!Array.isArray(values)) {
		throw new Error("Invalid embedding response from Gemini");
	}

	if (env.EMBEDDING_DIMENSION && values.length !== env.EMBEDDING_DIMENSION) {
		console.warn(
			`[AI] Embedding dimension mismatch. Expected ${env.EMBEDDING_DIMENSION}, got ${values.length}`,
		);
	}

	return values;
}

