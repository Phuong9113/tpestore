import dotenv from "dotenv";
import { getGenerativeModel } from "../utils/gemini.js";

dotenv.config();

// Danh sách model khả dụng (có thể thay đổi tùy key bạn được cấp)
const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

/**
 * 🧠 Hàm xử lý chat AI (gọi một lần, không stream)
 */
export async function chat(req, res) {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Chuẩn hóa lịch sử hội thoại
    const contents = [
      ...(history || []).map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    // Thử lần lượt các model khả dụng
    let responseText = "";
    let modelUsed = "";

    for (const modelId of MODEL_CANDIDATES) {
      try {
        const model = getGenerativeModel(modelId);

        const result = await model.generateContent({
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        });

        responseText = result.response.text();
        modelUsed = modelId;
        break; // thành công => dừng
      } catch (err) {
        console.warn(`[AI] Model ${modelId} failed:`, err.message);
        continue;
      }
    }

    if (!responseText) {
      throw new Error("All models failed to respond");
    }

    res.json({ reply: responseText, model: modelUsed });
  } catch (err) {
    console.error("[AI] /api/chat error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * ⚡ Hàm xử lý chat stream (nếu bạn muốn realtime)
 */
export async function chatStream(req, res) {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const contents = [
      ...(history || []).map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const modelId = "gemini-1.5-flash";
    const model = getGenerativeModel(modelId);

    const streamingResult = await model.generateContentStream({
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of streamingResult.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[AI] /api/chatStream error:", err);
    res.status(500).json({ error: err.message });
  }
}
