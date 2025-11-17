"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "user" | "model";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Simple AI chat box component that talks to the Express server at /api/chat
// Requirements covered:
// - Scrollable conversation
// - Input + send button (disabled during loading)
// - Different styles for user vs AI messages
// - Vietnamese defaults and inline comments for easy maintenance

const DEFAULT_ENDPOINT = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:4000";

interface ChatBoxProps {
  onClose?: () => void;
}

export default function ChatBox({ onClose }: ChatBoxProps): JSX.Element {
  const GREETING: ChatMessage = {
    role: "model",
    content:
      "Xin chào! Tôi là trợ lý tìm kiếm sản phẩm của TPE Store. Hãy mô tả nhu cầu để tôi gợi ý sản phẩm phù hợp nhé.",
  };
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<number>(0); // Key để force re-render textarea
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const canSend = useMemo<boolean>(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = useCallback(async () => {
    if (!canSend) return;
    const userText = input.trim();
    if (!userText) return;
    
    const userMsg: ChatMessage = { role: "user", content: userText };
    // Thêm câu hỏi của khách vào lịch sử và clear input ngay lập tức
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); // Clear state
    setInputKey((prev) => prev + 1); // Force re-render textarea để đảm bảo xóa hoàn toàn
    setLoading(true);

    try {
      // Convert messages to history format for product assistant API
      // Skip the greeting message and only include recent conversation
      const historyMessages = messages
        .slice(1) // Skip greeting
        .map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          content: msg.content,
        }));

      // POST to Product Assistant API (with function calling support)
      const res = await fetch(`${DEFAULT_ENDPOINT}/api/ai/products/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText, 
          history: historyMessages 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error || `Server error ${res.status}`);
      }

      const data: { answer?: string } = await res.json();
      const aiText = data?.answer || "Xin lỗi, tôi không thể trả lời ngay lúc này.";
      // Thêm câu trả lời AI vào lịch sử (giữ lại tất cả messages cũ)
      setMessages((prev) => [...prev, { role: "model", content: aiText }]);
    } catch (error) {
      // Thêm thông báo lỗi vào lịch sử
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi kết nối đến máy chủ AI. Vui lòng thử lại sau.";
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [canSend, input, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="w-full max-w-md rounded-xl border bg-card shadow-lg text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm font-medium">Trợ lý AI của TPE Store</p>
        </div>
        <button
          type="button"
          aria-label="Đóng trò chuyện"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm bg-secondary text-secondary-foreground hover:brightness-110"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="px-4 py-3 h-80 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-secondary text-secondary-foreground">
              Đang soạn trả lời…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3">
        <div className="flex items-end gap-2">
          <textarea
            key={inputKey}
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ví dụ: Tôi cần laptop mỏng nhẹ dưới 25 triệu..."
            className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-800"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!canSend}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-primary-foreground ${
              canSend ? "bg-primary hover:brightness-110" : "bg-primary/50 cursor-not-allowed"
            }`}
          >
            {loading ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
        <div className="mt-1 text-[11px] opacity-70">
          Mẹo: Nhấn Enter để gửi, Shift+Enter để xuống dòng.
        </div>
      </div>
    </div>
  );
}


