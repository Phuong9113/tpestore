import Link from "next/link"

const orders = [
  { id: "#ORD-001", customer: "Nguyễn Văn A", total: "₫15,500,000", status: "completed" },
  { id: "#ORD-002", customer: "Trần Thị B", total: "₫8,200,000", status: "processing" },
  { id: "#ORD-003", customer: "Lê Văn C", total: "₫22,000,000", status: "completed" },
  { id: "#ORD-004", customer: "Phạm Thị D", total: "₫5,800,000", status: "pending" },
  { id: "#ORD-005", customer: "Hoàng Văn E", total: "₫12,300,000", status: "processing" },
]

const statusConfig = {
  completed: { label: "Hoàn thành", color: "bg-green-500/10 text-green-500" },
  processing: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-500" },
  pending: { label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-500" },
}

export default function RecentOrders() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Đơn hàng gần đây</h3>
          <p className="text-sm text-muted-foreground mt-1">5 đơn hàng mới nhất</p>
        </div>
        <Link href="/admin/orders" className="text-sm text-primary hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{order.id}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{order.customer}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">{order.total}</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status as keyof typeof statusConfig].color}`}
              >
                {statusConfig[order.status as keyof typeof statusConfig].label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
