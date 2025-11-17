import prisma from "../utils/prisma.js";
import { env } from "../config/env.js";

const BRAND_SPEC_KEYS = ["brand", "thương hiệu", "hãng", "manufacturer"];

export async function fetchProductsForEmbedding({ productIds = [], skip = 0, take = 100 } = {}) {
	const where = productIds.length ? { id: { in: productIds } } : {};
	return prisma.product.findMany({
		where,
		skip,
		take,
		orderBy: { updatedAt: "desc" },
		include: {
			category: true,
			specs: {
				include: { specField: true },
			},
		},
	});
}

export function normalizeProductRecord(product) {
	if (!product) {
		throw new Error("Product is required for normalization");
	}

	const specs = (product.specs || [])
		.map((spec) => ({
			fieldName: spec?.specField?.name || spec?.specFieldId || "Unknown",
			value: spec?.value ?? "",
		}))
		.filter((spec) => spec.value);

	const brand = extractBrand(specs) || "Unknown";

	return {
		productId: product.id,
		productName: product.name,
		categoryId: product.categoryId,
		categoryName: product.category?.name || "Khác",
		brand,
		price: Number(product.price) || 0,
		description: product.description || "",
		imageUrl: resolveImageUrl(product.image),
		specs,
	};
}

export function buildSpecMap(specs = []) {
	return specs.reduce((acc, spec) => {
		const key = normalizeKey(spec.fieldName);
		if (!key) return acc;
		acc[key] = spec.value;
		return acc;
	}, {});
}

function extractBrand(specs) {
	const specMap = buildSpecMap(specs);
	for (const key of BRAND_SPEC_KEYS) {
		if (specMap[key]) {
			return specMap[key];
		}
	}
	return "";
}

export function normalizeKey(input = "") {
	return input
		.toString()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

function resolveImageUrl(imagePath) {
	if (!imagePath) return "";
	if (/^https?:\/\//i.test(imagePath)) return imagePath;
	const base = env.CLIENT_URL?.replace(/\/$/, "") || "";
	if (!base) return imagePath;
	if (imagePath.startsWith("/")) {
		return `${base}${imagePath}`;
	}
	return `${base}/uploads/${imagePath}`;
}

