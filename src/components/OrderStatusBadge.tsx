import { Badge } from "@/components/ui/badge"

interface OrderStatusBadgeProps {
  status: string
  statusText?: string
}

export function OrderStatusBadge({ status, statusText }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "1":
        return {
          label: statusText || "Chưa tiếp nhận",
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        }
      case "2":
        return {
          label: statusText || "Đã tiếp nhận",
          variant: "default" as const,
          className: "bg-blue-100 text-blue-800 border-blue-200"
        }
      case "3":
        return {
          label: statusText || "Đã lấy hàng",
          variant: "default" as const,
          className: "bg-purple-100 text-purple-800 border-purple-200"
        }
      case "4":
        return {
          label: statusText || "Đã giao hàng",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200"
        }
      case "5":
        return {
          label: statusText || "Đã hủy",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 border-red-200"
        }
      case "6":
        return {
          label: statusText || "Đã trả hàng",
          variant: "destructive" as const,
          className: "bg-orange-100 text-orange-800 border-orange-200"
        }
      default:
        return {
          label: statusText || "Không xác định",
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 border-gray-200"
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} font-medium`}
    >
      {config.label}
    </Badge>
  )
}
