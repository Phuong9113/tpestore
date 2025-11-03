import { Router } from "express";
import { chat, chatStream } from "../controllers/ai.controller.js";

const router = Router();

// POST /api/chat
router.post("/chat", chat);

// POST /api/chat-stream (SSE)
router.post("/chat-stream", chatStream);

export default router;


