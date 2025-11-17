const numberFormatter = new Intl.NumberFormat("vi-VN");

export function buildEmbeddingText(product) {
	if (!product) {
		throw new Error("Product data is required to build embedding text");
	}

	const priceText = numberFormatter.format(product.price || 0);
	const specs = product.specs || [];
	const specsText = specs.length
		? specs.map((spec) => `- ${spec.fieldName}: ${spec.value}`).join("\n")
		: "- Không có dữ liệu";

	return `[SẢN PHẨM] ${product.productName}
[PHÂN LOẠI] ${product.categoryName} | Thương hiệu: ${product.brand}
[TÓM TẮT] ${product.description}
[GIÁ BÁN] ${priceText} VNĐ

--- THÔNG SỐ KỸ THUẬT ---
${specsText}`.trim();
}

