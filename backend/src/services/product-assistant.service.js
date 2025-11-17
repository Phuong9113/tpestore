import prisma from "../utils/prisma.js";
import { env } from "../config/env.js";
import { getGenerativeModel, withGeminiRetry } from "../utils/gemini.js";
import { normalizeProductRecord, buildSpecMap, normalizeKey } from "./product-normalizer.service.js";

const SPEC_KEY_MAP = {
	brand: ["brand", "thuong_hieu", "thương_hiệu", "hãng", "hang", "manufacturer", "nhà_sản_xuất"],
	display_size_inch: ["display_size", "kich_thuoc_man_hinh", "kích_thước_màn_hình", "man_hinh", "màn_hình", "screen_size", "kich_thuoc", "kích_thước", "size", "inch"],
	refresh_rate_hz: ["refresh_rate", "tan_so_quet", "tần_số_quét", "tan_so", "tần_số", "refresh_hz", "hz", "fps"],
	chip_model: ["chip", "cpu", "processor", "chipset", "chip_model", "vi_xu_ly", "bộ_xử_lý"],
	ram_gb: ["ram", "bo_nho_ram", "bộ_nhớ_ram", "memory_ram", "memory"],
	storage_gb: ["storage", "bo_nho_trong", "bộ_nhớ_trong", "rom", "dung_luong", "dung_lượng", "ổ_cứng", "hard_drive"],
};

// Category aliases to help match user queries to actual category names in DB
const CATEGORY_ALIASES = {
	"màn hình": "Màn hình máy tính",
	"màn hình máy tính": "Màn hình máy tính",
	"monitor": "Màn hình máy tính",
	"screen": "Màn hình máy tính",
	"điện thoại": "Điện thoại",
	"smartphone": "Điện thoại",
	"phone": "Điện thoại",
	"laptop": "Laptop",
	"máy tính xách tay": "Laptop",
	"notebook": "Laptop",
	"tablet": "Tablet",
	"máy tính bảng": "Tablet",
	"phụ kiện": "Phụ kiện",
	"accessories": "Phụ kiện",
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

	const firstResponse = await withGeminiRetry(() =>
		model.generateContent({
			contents,
			tools: [{ functionDeclarations: [SEARCH_PRODUCTS_FUNCTION] }],
		}),
	);

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

	const followUp = await withGeminiRetry(() =>
		model.generateContent({
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
		}),
	);

	return {
		answer: followUp?.response?.text() || "",
		products: searchResults,
		usedFunction: true,
	};
}

export async function searchProducts(filters) {
	// Log for debugging
	console.log("[AI] searchProducts called with filters:", JSON.stringify(filters, null, 2));
	
	if (!filters?.product_type) {
		throw new Error("product_type is required");
	}

	const where = {};

	// Normalize product_type using aliases
	const normalizedProductType = CATEGORY_ALIASES[filters.product_type.toLowerCase()] || filters.product_type;
	
	if (normalizedProductType) {
		where.category = {
			name: {
				contains: normalizedProductType,
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
		take: 100, // Increase to get more candidates for filtering
	});

	console.log(`[AI] Found ${candidates.length} candidates before spec filtering`);

	const filtered = candidates
		.filter((product) => matchExtraFilters(product, filters))
		.slice(0, 10)
		.map((product) => normalizeProductRecord(product));

	console.log(`[AI] After filtering: ${filtered.length} products matched`);

	// If no exact matches but we have candidates, return top matches anyway (relaxed search)
	if (filtered.length === 0 && candidates.length > 0) {
		console.log("[AI] No exact spec matches, returning top candidates by category");
		return candidates
			.slice(0, 5)
			.map((product) => normalizeProductRecord(product));
	}

	return filtered;
}

function matchExtraFilters(product, filters = {}) {
	const specMap = buildSpecMap(product.specs || []);
	let matchCount = 0;
	let requiredMatches = 0;

	// Count how many filters are provided
	if (filters.brand) requiredMatches++;
	if (filters.display_size_inch) requiredMatches++;
	if (filters.refresh_rate_hz) requiredMatches++;
	if (filters.chip_model) requiredMatches++;
	if (filters.ram_gb) requiredMatches++;
	if (filters.storage_gb) requiredMatches++;

	// Brand matching (case-insensitive, partial match)
	if (filters.brand) {
		if (matchesSpec(specMap, "brand", filters.brand)) {
			matchCount++;
		} else {
			// Also check product name and category for brand
			const productNameLower = (product.name || "").toLowerCase();
			const brandLower = filters.brand.toLowerCase();
			if (productNameLower.includes(brandLower)) {
				matchCount++;
			}
		}
	}

	// Display size matching (with tolerance)
	if (filters.display_size_inch) {
		if (matchesSpec(specMap, "display_size_inch", filters.display_size_inch)) {
			matchCount++;
		}
	}

	// Refresh rate matching
	if (filters.refresh_rate_hz) {
		if (matchesSpec(specMap, "refresh_rate_hz", String(filters.refresh_rate_hz))) {
			matchCount++;
		}
	}

	// Chip model matching
	if (filters.chip_model) {
		if (matchesSpec(specMap, "chip_model", filters.chip_model)) {
			matchCount++;
		}
	}

	// RAM matching
	if (filters.ram_gb) {
		if (matchesSpec(specMap, "ram_gb", filters.ram_gb)) {
			matchCount++;
		}
	}

	// Storage matching
	if (filters.storage_gb) {
		if (matchesSpec(specMap, "storage_gb", filters.storage_gb)) {
			matchCount++;
		}
	}

	// Require at least 50% of filters to match (relaxed matching)
	const matchThreshold = Math.max(1, Math.ceil(requiredMatches * 0.5));
	return matchCount >= matchThreshold;
}

function matchesSpec(specMap, field, expected) {
	const keys = SPEC_KEY_MAP[field] || [field];
	const expectedStr = expected.toString().toLowerCase().trim();
	
	return keys.some((key) => {
		const normalizedKey = normalizeKey(key);
		const value = specMap[normalizedKey];
		if (!value) return false;
		
		const valueStr = value.toString().toLowerCase().trim();
		
		// Extract numbers from both strings for numeric comparison
		const extractNumbers = (str) => {
			const match = str.match(/(\d+(?:\.\d+)?)/);
			return match ? parseFloat(match[1]) : null;
		};
		
		const expectedNum = extractNumbers(expectedStr);
		const valueNum = extractNumbers(valueStr);
		
		// If both have numbers, compare them (allow ±10% tolerance for display size, exact for RAM/storage)
		if (expectedNum !== null && valueNum !== null) {
			if (field === "display_size_inch" || field === "refresh_rate_hz") {
				// Allow ±10% tolerance for display size and refresh rate
				return Math.abs(valueNum - expectedNum) <= expectedNum * 0.1;
			} else if (field === "ram_gb" || field === "storage_gb") {
				// Exact match or contains for RAM/storage (e.g., "8GB" matches "8 GB" or "8GB DDR4")
				return valueNum === expectedNum || valueStr.includes(expectedNum.toString());
			}
		}
		
		// Fallback to string contains (for chip_model, brand, etc.)
		return valueStr.includes(expectedStr) || expectedStr.includes(valueStr);
	});
}

function extractFunctionCall(response) {
	const candidate = response?.response?.candidates?.[0];
	const parts = candidate?.content?.parts || [];
	return parts.find((part) => part.functionCall)?.functionCall || null;
}

function parseFunctionArgs(functionCall) {
	try {
		if (!functionCall?.args) return {};
		if (typeof functionCall.args === "string") {
			return JSON.parse(functionCall.args);
		}
		if (typeof functionCall.args === "object") {
			return functionCall.args;
		}
		return {};
	} catch (error) {
		console.warn("[AI] Failed to parse function call args", error);
		return {};
	}
}

