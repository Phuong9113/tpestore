export function buildComparisonTable(products = []) {
	if (!Array.isArray(products) || products.length < 2 || products.length > 3) {
		return null;
	}

	const headers = ["Thông số", ...products.map((product) => product.productName)];
	const specNames = new Set(["Giá", "Mô tả"]);

	products.forEach((product) => {
		(product.specs || []).forEach((spec) => {
			specNames.add(spec.fieldName);
		});
	});

	const rows = Array.from(specNames).map((name) => ({
		label: name,
		values: products.map((product) => {
			if (name === "Giá") {
				const price = Number(product.price || 0).toLocaleString("vi-VN");
				return `${price}₫`;
			}
			if (name === "Mô tả") {
				return product.description || "";
			}

			const spec = (product.specs || []).find((entry) => entry.fieldName === name);
			return spec?.value || "N/A";
		}),
	}));

	return { headers, rows };
}

