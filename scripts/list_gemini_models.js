#!/usr/bin/env node
import "dotenv/config";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
	console.error("❌ Missing GEMINI_API_KEY in .env");
	process.exit(1);
}

const API_URL = "https://generativelanguage.googleapis.com/v1/models";

async function fetchModels() {
	const res = await fetch(`${API_URL}?key=${API_KEY}`);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to fetch models (${res.status}): ${text}`);
	}
	const data = await res.json();
	return Array.isArray(data.models) ? data.models : [];
}

function categorizeModels(models) {
	const categories = {
		text: [],
		assistant: [],
		embed: [],
		other: [],
	};

	for (const model of models) {
		const methods = model.supportedGenerationMethods || [];
		const hasGenerate = methods.includes("generateContent");
		const hasEmbed = methods.includes("embedContent");
		const hasTool = methods.includes("toolUse") || model.name.includes("assistant");

		if (hasEmbed) {
			categories.embed.push(model);
		} else if (hasGenerate && hasTool) {
			categories.assistant.push(model);
		} else if (hasGenerate) {
			categories.text.push(model);
		} else {
			categories.other.push(model);
		}
	}

	return categories;
}

function suggestEnvValues(categories) {
	const pick = (list, fallback) => (list.length ? list[0].name : fallback);
	return {
		GEMINI_MODEL: pick(categories.text, "models/gemini-1.5-flash"),
		GEMINI_RAG_MODEL: pick(categories.text, "models/gemini-1.5-flash"),
		GEMINI_ASSIST_MODEL: pick(categories.assistant, pick(categories.text, "models/gemini-1.5-pro")),
		GEMINI_EMBED_MODEL: pick(categories.embed, "models/text-embedding-004"),
	};
}

function printModels(categories) {
	const printList = (title, list) => {
		console.log(`\n=== ${title} (${list.length}) ===`);
		if (!list.length) {
			console.log("  (none)");
			return;
		}
		for (const model of list) {
			const methods = (model.supportedGenerationMethods || []).join(", ");
			console.log(`- ${model.name} [methods: ${methods}]`);
		}
	};

	printList("Text / RAG models", categories.text);
	printList("Assistant (tool) models", categories.assistant);
	printList("Embedding models", categories.embed);
	printList("Other models", categories.other);
}

async function main() {
	try {
		console.log("🔍 Fetching Gemini models...");
		const models = await fetchModels();
		const categories = categorizeModels(models);

		printModels(categories);

		const suggestions = suggestEnvValues(categories);
		console.log("\n✅ Suggested .env values:");
		Object.entries(suggestions).forEach(([key, value]) => {
			console.log(`  ${key}=${value}`);
		});

		console.log("\nRun: npm run server    # then ensure env values match suggestions above.");
	} catch (error) {
		console.error("❌ Failed to list models:", error.message);
		process.exit(1);
	}
}

main();

