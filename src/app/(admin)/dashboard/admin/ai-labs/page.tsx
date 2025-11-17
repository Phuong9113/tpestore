"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:4000";
const PRODUCT_AI_PREFIX = `${AI_BASE_URL}/api/ai/products`;

type NormalizedProduct = {
	productId: string;
	productName: string;
	categoryName: string;
	brand: string;
	price: number;
	description: string;
	imageUrl?: string;
	specs?: Array<{ fieldName: string; value: string }>;
};

interface SemanticResult {
	productId: string;
	score: number;
	product?: NormalizedProduct | null;
	rawText?: string;
}

interface RagComparison {
	headers: string[];
	rows: Array<{ label: string; values: string[] }>;
}

interface RagResponse {
	answer: string;
	products: Array<{ productId: string; score: number; data: NormalizedProduct }>;
	comparison: RagComparison | null;
}

type AssistantMessage = { role: "user" | "assistant"; content: string };

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
	style: "currency",
	currency: "VND",
});

const formatCurrency = (value?: number | null) => {
	if (typeof value !== "number") return "—";
	return currencyFormatter.format(value);
};

export default function AiLabsPage() {
	const [batchSize, setBatchSize] = useState(50);
	const [concurrency, setConcurrency] = useState(4);
	const [rebuildLoading, setRebuildLoading] = useState(false);
	const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);
	const [embeddingsStatus, setEmbeddingsStatus] = useState<any>(null);

	const [semanticQuery, setSemanticQuery] = useState("");
	const [semanticTopK, setSemanticTopK] = useState(5);
	const [semanticMinScore, setSemanticMinScore] = useState(0.35);
	const [semanticLoading, setSemanticLoading] = useState(false);
	const [semanticError, setSemanticError] = useState<string | null>(null);
	const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([]);

	const [ragQuestion, setRagQuestion] = useState("");
	const [ragLoading, setRagLoading] = useState(false);
	const [ragError, setRagError] = useState<string | null>(null);
	const [ragResponse, setRagResponse] = useState<RagResponse | null>(null);

	const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
		{
			role: "assistant",
			content:
				"Xin chào! Tôi là trợ lý tìm kiếm sản phẩm của TPE Store. Hãy mô tả nhu cầu để tôi gợi ý sản phẩm phù hợp nhé.",
		},
	]);
	const [assistantInput, setAssistantInput] = useState("");
	const [assistantLoading, setAssistantLoading] = useState(false);
	const [assistantError, setAssistantError] = useState<string | null>(null);

	const comparisonHeaders = useMemo(() => ragResponse?.comparison?.headers ?? [], [ragResponse]);

	async function checkEmbeddingsStatus() {
		try {
			const res = await fetch(`${PRODUCT_AI_PREFIX}/embeddings/status`);
			if (!res.ok) throw new Error("Không thể kiểm tra trạng thái.");
			const data = await res.json();
			setEmbeddingsStatus(data);
		} catch (error) {
			console.error("[Frontend] Check embeddings status error:", error);
		}
	}

	async function triggerRebuild() {
		setRebuildLoading(true);
		setRebuildMessage(null);
		try {
			const res = await fetch(`${PRODUCT_AI_PREFIX}/embeddings/rebuild`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ batchSize, concurrency }),
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				throw new Error(payload?.error || "Không thể chạy rebuild.");
			}
			const data = await res.json().catch(() => ({}));
			setRebuildMessage(
				`Đã chạy xong: ${data?.success || data?.total || 0} sản phẩm thành công, lỗi ${data?.failures?.length || 0}.`,
			);
			await checkEmbeddingsStatus();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Không thể gọi API.";
			setRebuildMessage(message);
		} finally {
			setRebuildLoading(false);
		}
	}

	async function runSemanticSearch() {
		if (!semanticQuery.trim()) return;
		setSemanticLoading(true);
		setSemanticError(null);
		try {
			const res = await fetch(`${PRODUCT_AI_PREFIX}/search`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: semanticQuery, topK: semanticTopK, minScore: semanticMinScore }),
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				const errorMsg = payload?.error || `HTTP ${res.status}: Không thể tìm kiếm.`;
				console.error("[Frontend] Semantic search error:", payload);
				throw new Error(errorMsg);
			}
			const data = await res.json();
			const items = Array.isArray(data?.items) ? data.items : [];
			console.log(`[Frontend] Semantic search returned ${items.length} items`);
			setSemanticResults(items);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Không thể gọi API.";
			setSemanticError(message);
		} finally {
			setSemanticLoading(false);
		}
	}

	async function runRagQuestion() {
		if (!ragQuestion.trim()) return;
		setRagLoading(true);
		setRagError(null);
		try {
			const res = await fetch(`${PRODUCT_AI_PREFIX}/query`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: ragQuestion, topK: semanticTopK, minScore: semanticMinScore }),
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				const errorMsg = payload?.error || `HTTP ${res.status}: Không thể hỏi RAG.`;
				console.error("[Frontend] RAG query error:", payload);
				throw new Error(errorMsg);
			}
			const data = await res.json();
			console.log("[Frontend] RAG query returned:", { 
				answerLength: data?.answer?.length || 0, 
				productsCount: data?.products?.length || 0 
			});
			setRagResponse(data);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Không thể gọi API.";
			setRagError(message);
		} finally {
			setRagLoading(false);
		}
	}

	async function sendAssistantMessage() {
		if (!assistantInput.trim()) return;
		const userMessage: AssistantMessage = { role: "user", content: assistantInput.trim() };
		const historyPayload = assistantMessages.map((message) => ({
			role: message.role === "assistant" ? "model" : "user",
			content: message.content,
		}));

		setAssistantMessages((prev) => [...prev, userMessage]);
		setAssistantInput("");
		setAssistantLoading(true);
		setAssistantError(null);

		try {
			const res = await fetch(`${PRODUCT_AI_PREFIX}/assistant`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMessage.content, history: historyPayload }),
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				throw new Error(payload?.error || "Assistant không phản hồi.");
			}
			const data = await res.json();
			setAssistantMessages((prev) => [
				...prev,
				{ role: "assistant", content: data?.answer || "Tôi chưa có câu trả lời." },
			]);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Không thể gọi assistant.";
			setAssistantError(message);
			setAssistantMessages((prev) => [
				...prev,
				{ role: "assistant", content: "Đã xảy ra lỗi khi gọi trợ lý. Vui lòng thử lại." },
			]);
		} finally {
			setAssistantLoading(false);
		}
	}

	// Load embeddings status on mount
	useEffect(() => {
		checkEmbeddingsStatus();
	}, []);

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
					Gemini + pgvector Lab
				</p>
				<h1 className="text-3xl font-bold tracking-tight text-foreground">AI Product Studio</h1>
				<p className="text-muted-foreground">
					Dùng trang này để thử nhanh RAG, semantic search, trợ lý function-calling và thao tác batch
					embedding ngay trên dữ liệu thật của TPE Store.
				</p>
			</div>

			<section className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-2xl border bg-card p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-foreground">Batch Rebuild Embeddings</h2>
					<p className="text-sm text-muted-foreground mb-4">
						Gọi API `/ai/products/embeddings/rebuild` để chuẩn hóa và nhúng lại toàn bộ sản phẩm.
					</p>
					{embeddingsStatus && (
						<div className="mb-4 p-3 rounded-lg bg-muted/30 text-sm">
							<p>Total Products: {embeddingsStatus.totalProducts}</p>
							<p>Total Embeddings: {embeddingsStatus.totalEmbeddings}</p>
							<p>Coverage: {embeddingsStatus.coverage}</p>
							<p>Provider: {embeddingsStatus.provider}</p>
						</div>
					)}
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="text-xs font-medium text-muted-foreground">Batch size</label>
							<Input
								type="number"
								min={1}
								value={batchSize}
								onChange={(e) => setBatchSize(Number(e.target.value) || 1)}
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-muted-foreground">Concurrency</label>
							<Input
								type="number"
								min={1}
								value={concurrency}
								onChange={(e) => setConcurrency(Number(e.target.value) || 1)}
							/>
						</div>
					</div>
					<div className="mt-4 flex items-center gap-3">
						<Button disabled={rebuildLoading} onClick={triggerRebuild}>
							{rebuildLoading ? "Đang chạy..." : "Rebuild ngay"}
						</Button>
						<Button variant="outline" onClick={checkEmbeddingsStatus}>
							Kiểm tra trạng thái
						</Button>
						{rebuildMessage && <p className="text-sm text-muted-foreground">{rebuildMessage}</p>}
					</div>
				</div>

				<div className="rounded-2xl border bg-card p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-foreground">Thông số tìm kiếm</h2>
					<p className="text-sm text-muted-foreground mb-4">
						Các tham số này dùng chung cho cả semantic search và RAG bên dưới.
					</p>
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="text-xs font-medium text-muted-foreground">Top K</label>
							<Input
								type="number"
								min={1}
								value={semanticTopK}
								onChange={(e) => setSemanticTopK(Math.max(1, Number(e.target.value) || 1))}
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-muted-foreground">Min score</label>
							<Input
								type="number"
								step={0.05}
								min={0}
								max={1}
								value={semanticMinScore}
								onChange={(e) =>
									setSemanticMinScore(Math.min(1, Math.max(0, Number(e.target.value) || 0)))
								}
							/>
						</div>
					</div>
					<p className="mt-4 text-xs text-muted-foreground">
						Lưu ý: backend vẫn giữ cấu hình riêng, nhưng giá trị ở đây giúp bạn kiểm tra nhanh mà không
						cần dùng Postman.
					</p>
				</div>
			</section>

			<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<div>
						<h2 className="text-lg font-semibold text-foreground">Semantic Search</h2>
						<p className="text-sm text-muted-foreground">
							Gọi `/ai/products/search` → trả về embedding gần nhất và metadata sản phẩm đã chuẩn hóa.
						</p>
					</div>
					<Button variant="secondary" onClick={() => setSemanticResults([])}>
						Xóa kết quả
					</Button>
				</div>
				<div className="space-y-3">
					<Textarea
						value={semanticQuery}
						onChange={(e) => setSemanticQuery(e.target.value)}
						placeholder="Ví dụ: điện thoại chơi game dưới 15 triệu, màn hình 27 inch 165Hz..."
					/>
					<Button onClick={runSemanticSearch} disabled={semanticLoading}>
						{semanticLoading ? "Đang tìm..." : "Chạy semantic search"}
					</Button>
					{semanticError && <p className="text-sm text-destructive">{semanticError}</p>}
				</div>
				<div className="space-y-3">
					{semanticResults.length === 0 && !semanticLoading ? (
						<p className="text-sm text-muted-foreground">Chưa có kết quả.</p>
					) : (
						semanticResults.map((item) => (
							<div key={item.productId} className="rounded-xl border p-4">
								<div className="flex items-center justify-between flex-wrap gap-2">
									<div>
										<p className="text-base font-semibold">{item.product?.productName ?? item.productId}</p>
										<p className="text-xs text-muted-foreground">
											Độ tương đồng: {(item.score ?? 0).toFixed(3)}
										</p>
									</div>
									<p className="text-sm font-medium text-primary">
										{formatCurrency(item.product?.price)}
									</p>
								</div>
								<p className="text-sm text-muted-foreground mt-2">
									{item.product?.categoryName} • Thương hiệu: {item.product?.brand}
								</p>
								<p className="text-sm mt-2">{item.product?.description}</p>
								{item.product?.specs?.length ? (
									<ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
										{item.product.specs.slice(0, 6).map((spec) => (
											<li key={`${item.productId}-${spec.fieldName}`}>
												<span className="font-medium text-foreground">{spec.fieldName}:</span>{" "}
												{spec.value}
											</li>
										))}
									</ul>
								) : null}
							</div>
						))
					)}
				</div>
			</section>

			<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<div>
						<h2 className="text-lg font-semibold text-foreground">RAG Answer (Gemini 1.5)</h2>
						<p className="text-sm text-muted-foreground">
							Gọi `/ai/products/query` → lấy top vector + context JSON và nhờ Gemini trả lời.
						</p>
					</div>
					<Button variant="secondary" onClick={() => setRagResponse(null)}>
						Xóa kết quả
					</Button>
				</div>

				<div className="space-y-3">
					<Textarea
						value={ragQuestion}
						onChange={(e) => setRagQuestion(e.target.value)}
						placeholder="Ví dụ: Gợi ý laptop mỏng nhẹ dưới 25 triệu cho dân marketing..."
					/>
					<Button onClick={runRagQuestion} disabled={ragLoading}>
						{ragLoading ? "Đang gọi Gemini..." : "Hỏi RAG"}
					</Button>
					{ragError && <p className="text-sm text-destructive">{ragError}</p>}
				</div>

				{ragResponse && (
					<div className="space-y-4">
						<div className="rounded-xl bg-muted/30 p-4">
							<p className="text-sm font-semibold text-muted-foreground mb-2">Câu trả lời</p>
							<div className="whitespace-pre-wrap text-sm text-foreground">{ragResponse.answer}</div>
						</div>
						{ragResponse.products?.length ? (
							<div className="space-y-3">
								<p className="text-sm font-semibold text-muted-foreground">Sản phẩm liên quan</p>
								<div className="grid gap-3 lg:grid-cols-2">
									{ragResponse.products.map((item) => (
										<div key={item.productId} className="rounded-lg border p-4 space-y-2">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-base font-semibold">{item.data?.productName}</p>
													<p className="text-xs text-muted-foreground">
														{item.data?.categoryName} • Thương hiệu: {item.data?.brand}
													</p>
												</div>
												<p className="text-sm font-medium text-primary">
													{formatCurrency(item.data?.price)}
												</p>
											</div>
											<p className="text-xs text-muted-foreground">
												Score: {(item.score ?? 0).toFixed(3)}
											</p>
											<p className="text-sm">{item.data?.description}</p>
										</div>
									))}
								</div>
							</div>
						) : null}

						{ragResponse.comparison && (
							<div className="space-y-2">
								<p className="text-sm font-semibold text-muted-foreground">Bảng so sánh tự động</p>
								<div className="overflow-x-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr>
												{comparisonHeaders.map((header) => (
													<th key={header} className="border-b bg-muted/40 px-3 py-2 text-left font-semibold">
														{header}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{ragResponse.comparison.rows.map((row) => (
												<tr key={row.label} className="border-b last:border-b-0">
													<td className="px-3 py-2 font-medium">{row.label}</td>
													{row.values.map((value, idx) => (
														<td key={`${row.label}-${idx}`} className="px-3 py-2 text-muted-foreground">
															{value}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}
			</section>

			<section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<div>
						<h2 className="text-lg font-semibold text-foreground">Function Calling Assistant</h2>
						<p className="text-sm text-muted-foreground">
							Gọi `/ai/products/assistant` → Gemini sẽ tự động trigger hàm `search_products`.
						</p>
					</div>
					<Button variant="secondary" onClick={() => setAssistantMessages(assistantMessages.slice(0, 1))}>
						Làm mới hội thoại
					</Button>
				</div>

				<div className="h-64 overflow-y-auto rounded-xl border bg-muted/10 p-4 space-y-3">
					{assistantMessages.map((message, idx) => (
						<div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
									message.role === "user"
										? "bg-primary text-primary-foreground"
										: "bg-secondary text-secondary-foreground"
								}`}
							>
								{message.content}
							</div>
						</div>
					))}
				</div>

				{assistantError && <p className="text-sm text-destructive">{assistantError}</p>}

				<div className="flex flex-col gap-3 sm:flex-row">
					<Textarea
						value={assistantInput}
						onChange={(e) => setAssistantInput(e.target.value)}
						placeholder="Tôi cần màn hình 27 inch 144Hz, giá dưới 8 triệu..."
					/>
					<Button onClick={sendAssistantMessage} disabled={assistantLoading} className="sm:w-32">
						{assistantLoading ? "Đang gửi..." : "Gửi"}
					</Button>
				</div>
			</section>
		</div>
	);
}

