import { Badge } from "@/components/ui/badge"
import { resolveStatusLabel } from "@/lib/shipping-status"

interface OrderStatusBadgeProps {
  status: string | number
  statusText?: string
}

export function OrderStatusBadge({ status, statusText }: OrderStatusBadgeProps) {
  // Debug logging to validate incoming values
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[OrderStatusBadge] incoming", { status, statusText })
  }

  const resolved = resolveStatusLabel(status, statusText)

  const getStatusConfig = (label: string) => {
    // Choose color by final label semantics
    switch (label) {
      case "Chưa tiếp nhận":
        return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 border-yellow-200" }
      case "Đã tiếp nhận":
      case "Đã lấy hàng":
        return { variant: "default" as const, className: "bg-blue-100 text-blue-800 border-blue-200" }
      case "Đang giao hàng":
      case "Đang vận chuyển":
      case "Đang phân loại":
      case "Đang lưu kho":
        return { variant: "default" as const, className: "bg-purple-100 text-purple-800 border-purple-200" }
      case "Đã giao hàng":
        return { variant: "default" as const, className: "bg-green-100 text-green-800 border-green-200" }
      case "Đã hủy":
      case "Đã trả hàng":
      case "Giao hàng thất bại":
        return { variant: "destructive" as const, className: "bg-red-100 text-red-800 border-red-200" }
      default:
        return { variant: "secondary" as const, className: "bg-gray-100 text-gray-800 border-gray-200" }
    }
  }

  const config = getStatusConfig(resolved.label)

  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[OrderStatusBadge] resolved", { key: resolved.key, label: resolved.label, config })
  }

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} font-medium`}
    >
      {resolved.label}
    </Badge>
  )
}
