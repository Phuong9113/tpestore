import prisma from "../utils/prisma.js";
import { env } from "../config/env.js";
import { getGenerativeModel } from "../utils/gemini.js";
import { normalizeProductRecord, buildSpecMap, normalizeKey } from "./product-normalizer.service.js";

const SPEC_KEY_MAP = {
	brand: ["brand", "thuong_hieu", "hãng", "hang", "manufacturer"],
	display_size_inch: ["display_size", "kich_thuoc_man_hinh", "man_hinh", "screen_size"],
	refresh_rate_hz: ["refresh_rate", "tan_so_quet", "tan_so", "refresh_hz"],
	chip_model: ["chip", "cpu", "processor", "chipset", "chip_model"],
	ram_gb: ["ram", "bo_nho_ram", "memory_ram"],
	storage_gb: ["storage", "bo_nho_trong", "rom", "dung_luong"],
};

export const SEARCH_PRODUCTS_FUNCTION = {
	name: "search_products",
	description: "Truy vấn cơ sở dữ liệu sản phẩm để tìm các mặt hàng phù hợp.",
	parameters: {
		type: "object",
		properties: {
			product_type: { type: "string" },
			brand: { type: "string" },
			min_price_vnd: { type: "integer" },
			max_price_vnd: { type: "integer" },
			display_size_inch: { type: "string" },
			refresh_rate_hz: { type: "integer" },
			chip_model: { type: "string" },
			ram_gb: { type: "string" },
			storage_gb: { type: "string" },
		},
		required: ["product_type"],
	},
};

export async function handleProductAssistant({ message, history = [] }) {
	if (!message) {
		throw new Error("message is required");
	}

	const model = getGenerativeModel(env.GEMINI_ASSIST_MODEL, {
		tools: [{ functionDeclarations: [SEARCH_PRODUCTS_FUNCTION] }],
	});

	const contents = [
		...(history || []).map((item) => ({
			role: item.role,
			parts: [{ text: item.content }],
		})),
		{ role: "user", parts: [{ text: message }] },
	];

	const firstResponse = await model.generateContent({
		contents,
		tools: [{ functionDeclarations: [SEARCH_PRODUCTS_FUNCTION] }],
	});

	const functionCall = extractFunctionCall(firstResponse);

	if (!functionCall) {
		return {
			answer: firstResponse?.response?.text() || "",
			products: [],
			usedFunction: false,
		};
	}

	const args = parseFunctionArgs(functionCall);
	const searchResults = await searchProducts(args);

	const followUp = await model.generateContent({
		contents: [
			...contents,
			firstResponse.response.candidates?.[0]?.content,
			{
				role: "tool",
				parts: [
					{
						functionResponse: {
							name: functionCall.name,
							response: { products: searchResults },
						},
					},
				],
			},
		],
		tools: [{ functionDeclarations: [SEARCH_PRODUCTS_FUNCTION] }],
	});

	return {
		answer: followUp?.response?.text() || "",
		products: searchResults,
		usedFunction: true,
	};
}

export async function searchProducts(filters) {
	if (!filters?.product_type) {
		throw new Error("product_type is required");
	}

	const where = {};

	if (filters?.product_type) {
		where.category = {
			name: {
				contains: filters.product_type,
				mode: "insensitive",
			},
		};
	}

	if (filters?.min_price_vnd || filters?.max_price_vnd) {
		where.price = {};
		if (filters.min_price_vnd) {
			where.price.gte = filters.min_price_vnd;
		}
		if (filters.max_price_vnd) {
			where.price.lte = filters.max_price_vnd;
		}
	}

	const candidates = await prisma.product.findMany({
		where,
		include: {
			category: true,
			specs: { include: { specField: true } },
		},
		orderBy: { updatedAt: "desc" },
		take: 50,
	});

	const filtered = candidates
		.filter((product) => matchExtraFilters(product, filters))
		.slice(0, 10)
		.map((product) => normalizeProductRecord(product));

	return filtered;
}

function matchExtraFilters(product, filters = {}) {
	const specMap = buildSpecMap(product.specs || []);

	if (filters.brand && !matchesSpec(specMap, "brand", filters.brand)) {
		return false;
	}

	if (filters.display_size_inch && !matchesSpec(specMap, "display_size_inch", filters.display_size_inch)) {
		return false;
	}

	if (filters.refresh_rate_hz && !matchesSpec(specMap, "refresh_rate_hz", String(filters.refresh_rate_hz))) {
		return false;
	}

	if (filters.chip_model && !matchesSpec(specMap, "chip_model", filters.chip_model)) {
		return false;
	}

	if (filters.ram_gb && !matchesSpec(specMap, "ram_gb", filters.ram_gb)) {
		return false;
	}

	if (filters.storage_gb && !matchesSpec(specMap, "storage_gb", filters.storage_gb)) {
		return false;
	}

	return true;
}

function matchesSpec(specMap, field, expected) {
	const keys = SPEC_KEY_MAP[field] || [field];
	return keys.some((key) => {
		const normalizedKey = normalizeKey(key);
		const value = specMap[normalizedKey];
		return (
			value &&
			value
				.toString()
				.toLowerCase()
				.includes(expected.toString().toLowerCase())
		);
	});
}

function extractFunctionCall(response) {
	const candidate = response?.response?.candidates?.[0];
	const parts = candidate?.content?.parts || [];
	return parts.find((part) => part.functionCall)?.functionCall || null;
}

function parseFunctionArgs(functionCall) {
	try {
		return functionCall.args ? JSON.parse(functionCall.args) : {};
	} catch (error) {
		console.warn("[AI] Failed to parse function call args", error);
		return {};
	}
}

