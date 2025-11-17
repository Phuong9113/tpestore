const numberFormatter = new Intl.NumberFormat("vi-VN");

export function buildEmbeddingText(product) {
	if (!product) {
		throw new Error("Product data is required to build embedding text");
	}

	const priceText = numberFormatter.format(product.price || 0);
	const specs = product.specs || [];
	
	// Prioritize important specs (RAM, storage, chip, display, refresh rate) at the top
	const importantSpecKeys = ["ram", "storage", "chip", "cpu", "processor", "display", "screen", "refresh", "pin", "battery"];
	const sortedSpecs = [...specs].sort((a, b) => {
		const aKey = a.fieldName.toLowerCase();
		const bKey = b.fieldName.toLowerCase();
		const aImportant = importantSpecKeys.some(key => aKey.includes(key));
		const bImportant = importantSpecKeys.some(key => bKey.includes(key));
		if (aImportant && !bImportant) return -1;
		if (!aImportant && bImportant) return 1;
		return 0;
	});
	
	const specsText = sortedSpecs.length
		? sortedSpecs.map((spec) => `- ${spec.fieldName}: ${spec.value}`).join("\n")
		: "- Không có dữ liệu";

	return `[SẢN PHẨM] ${product.productName}
[PHÂN LOẠI] ${product.categoryName} | Thương hiệu: ${product.brand}
[TÓM TẮT] ${product.description}
[GIÁ BÁN] ${priceText} VNĐ

--- THÔNG SỐ KỸ THUẬT ---
${specsText}`.trim();
}

