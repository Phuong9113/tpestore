import express from "express";
import { chat, chatStream } from "../controllers/ai.controller.js";
import {
	checkEmbeddingsStatus,
	embedProduct,
	productAssistant,
	queryProductRag,
	rebuildEmbeddings,
	semanticSearch,
} from "../controllers/product-ai.controller.js";

const router = express.Router();

router.post("/chat", chat);
router.post("/chat-stream", chatStream);
router.get("/ai/products/embeddings/status", checkEmbeddingsStatus);
router.post("/ai/products/embeddings/rebuild", rebuildEmbeddings);
router.post("/ai/products/embeddings/:productId", embedProduct);
router.post("/ai/products/query", queryProductRag);
router.post("/ai/products/search", semanticSearch);
router.post("/ai/products/assistant", productAssistant);

export default router;


