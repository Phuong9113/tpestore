import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/api/v1/products`;
const EMBEDDINGS_ENDPOINT = `${API_BASE_URL}/api/ai/products/embeddings/rebuild`;

const BATCH_SIZE = Number(process.env.EMBED_BATCH_SIZE) || 50;
const CONCURRENCY = Number(process.env.EMBED_CONCURRENCY) || 4;

async function fetchAllProductIds() {
	const response = await axios.get(PRODUCTS_ENDPOINT, {
		headers: { "Content-Type": "application/json" },
	});

	const products = response.data?.data;
	if (!Array.isArray(products)) {
		throw new Error("Không thể đọc danh sách sản phẩm từ API /api/v1/products");
	}

	return products.map((product) => product.id).filter(Boolean);
}

function chunkArray(items, size) {
	const chunks = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

async function processBatch(batchIds, batchIndex, totalBatches) {
	try {
		await axios.post(
			EMBEDDINGS_ENDPOINT,
			{
				productIds: batchIds,
				batchSize: BATCH_SIZE,
				concurrency: CONCURRENCY,
			},
			{
				headers: { "Content-Type": "application/json" },
			},
		);
		console.log(`Batch ${batchIndex + 1}/${totalBatches} nhúng xong (sản phẩm: ${batchIds.length}).`);
	} catch (error) {
		const message = error.response?.data?.error || error.message;
		console.error(`Batch ${batchIndex + 1}/${totalBatches} thất bại: ${message}`);
	}
}

async function seedEmbeddings() {
	try {
		console.log("Đang tải danh sách sản phẩm...");
		const productIds = await fetchAllProductIds();

		if (!productIds.length) {
			console.log("Không có sản phẩm nào để nhúng.");
			return;
		}

		const batches = chunkArray(productIds, BATCH_SIZE);
		console.log(`Bắt đầu nhúng ${productIds.length} sản phẩm trong ${batches.length} batch.`);

		for (let i = 0; i < batches.length; i++) {
			await processBatch(batches[i], i, batches.length);
		}

		console.log("Hoàn tất nhúng embeddings cho tất cả sản phẩm.");
	} catch (error) {
		console.error("Không thể thực hiện seed embeddings:", error.message);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	seedEmbeddings();
}

