export const GHN_STATUS_MAP: Record<string, string> = {
  ready_to_pick: "Chưa tiếp nhận",
  picking: "Đã tiếp nhận",
  picked: "Đã lấy hàng",
  storing: "Đang lưu kho",
  transporting: "Đang vận chuyển",
  sorting: "Đang phân loại",
  delivering: "Đang giao hàng",
  delivered: "Đã giao hàng",
  delivery_fail: "Giao hàng thất bại",
  waiting_to_return: "Chờ trả hàng",
  return: "Đang trả hàng",
  returned: "Đã trả hàng",
  exception: "Ngoại lệ",
  damage: "Hàng hóa bị hỏng",
  lost: "Hàng hóa bị mất",
  cancel: "Đã hủy",
};

// Some partners return numeric codes as strings (e.g., GHTK). Keep compatibility.
export const NUMERIC_STATUS_MAP: Record<string, string> = {
  "1": "Chưa tiếp nhận",
  "2": "Đã tiếp nhận",
  "3": "Đã lấy hàng",
  "4": "Đã giao hàng",
  "5": "Đã hủy",
  "6": "Đã trả hàng",
};

export function resolveStatusLabel(status: string | number | undefined | null, fallbackText?: string): { label: string; key: string } {
  const raw = (status ?? "").toString().trim();
  if (!raw) return { label: fallbackText || "Không xác định", key: "" };
  const key = raw.toLowerCase();
  // Prefer GHN textual statuses
  if (GHN_STATUS_MAP[key]) return { label: GHN_STATUS_MAP[key], key };
  // Fallback numeric map
  if (NUMERIC_STATUS_MAP[raw]) return { label: NUMERIC_STATUS_MAP[raw], key: raw };
  // Unknown → use fallbackText or raw
  return { label: fallbackText || raw, key };
}


