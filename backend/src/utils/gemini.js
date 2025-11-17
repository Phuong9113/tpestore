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

export async function withGeminiRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
	let attempt = 0;
	let lastError;
	while (attempt <= retries) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			const status = error?.status;
			const retryable = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
			if (!retryable || attempt === retries) {
				break;
			}
			const delayMs = baseDelayMs * Math.pow(2, attempt);
			await wait(delayMs);
			attempt += 1;
		}
	}
	throw lastError;
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

