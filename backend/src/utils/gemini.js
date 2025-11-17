import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

let client;

export function getGeminiClient() {
	if (!env.GEMINI_API_KEY) {
		throw new Error("GEMINI_API_KEY is not configured");
	}

	if (!client) {
		client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
	}

	return client;
}

export function getGenerativeModel(modelId, options = {}) {
	const gemini = getGeminiClient();
	return gemini.getGenerativeModel({ model: modelId, ...options });
}

