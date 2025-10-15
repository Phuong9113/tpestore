"use client"

import { useState } from "react"
import { MagnifyingGlassIcon, EyeIcon } from "@heroicons/react/24/outline"
import OrderDetailModal from "@/components/admin/OrderDetailModal"

const initialOrders = [
  {
    id: "ORD-001",
    customer: { name: "Nguyễn Văn A", email: "nguyenvana@example.com", phone: "0901234567" },
    date: "2024-12-15 14:30",
    total: 15500000,
    status: "completed",
    payment: "paid",
    items: [{ name: "iPhone 15 Pro Max", quantity: 1, price: 15500000 }],
    shipping: {
      address: "123 Đường ABC, Quận 1, TP.HCM",
      method: "Giao hàng nhanh",
      fee: 0,
    },
  },
  {
    id: "ORD-002",
    customer: { name: "Trần Thị B", email: "tranthib@example.com", phone: "0912345678" },
    date: "2024-12-15 10:15",
    total: 8200000,
    status: "processing",
    payment: "paid",
    items: [
      { name: "AirPods Pro 2", quantity: 2, price: 6490000 },
      { name: "Anker PowerCore", quantity: 1, price: 1290000 },
    ],
    shipping: {
      address: "456 Đường XYZ, Quận 3, TP.HCM",
      method: "Giao hàng tiêu chuẩn",
      fee: 30000,
    },
  },
  {
    id: "ORD-003",
    customer: { name: "Lê Văn C", email: "levanc@example.com", phone: "0923456789" },
    date: "2024-12-14 16:45",
    total: 22000000,
    status: "completed",
    payment: "paid",
    items: [{ name: "iPad Pro M2", quantity: 1, price: 22990000 }],
    shipping: {
      address: "789 Đường DEF, Quận 7, TP.HCM",
      method: "Giao hàng nhanh",
      fee: 0,
    },
  },
  {
    id: "ORD-004",
    customer: { name: "Phạm Thị D", email: "phamthid@example.com", phone: "0934567890" },
    date: "2024-12-14 09:20",
    total: 5800000,
    status: "pending",
    payment: "pending",
    items: [
      { name: "Logitech MX Master 3S", quantity: 1, price: 2490000 },
      { name: "Keychron K8 Pro", quantity: 1, price: 3290000 },
    ],
    shipping: {
      address: "321 Đường GHI, Quận 10, TP.HCM",
      method: "Giao hàng tiêu chuẩn",
      fee: 30000,
    },
  },
  {
    id: "ORD-005",
    customer: { name: "Hoàng Văn E", email: "hoangvane@example.com", phone: "0945678901" },
    date: "2024-12-13 11:30",
    total: 12300000,
    status: "shipping",
    payment: "paid",
    items: [{ name: "Samsung Tab S9+", quantity: 1, price: 24990000 }],
    shipping: {
      address: "654 Đường JKL, Quận 2, TP.HCM",
      method: "Giao hàng nhanh",
      fee: 0,
    },
  },
  {
    id: "ORD-006",
    customer: { name: "Võ Thị F", email: "vothif@example.com", phone: "0956789012" },
    date: "2024-12-13 08:15",
    total: 3800000,
    status: "cancelled",
    payment: "refunded",
    items: [{ name: "Sony WH-1000XM5", quantity: 1, price: 8990000 }],
    shipping: {
      address: "987 Đường MNO, Quận 5, TP.HCM",
      method: "Giao hàng tiêu chuẩn",
      fee: 30000,
    },
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
    const matchesPayment = selectedPayment === "all" || order.payment === selectedPayment
    return matchesSearch && matchesStatus && matchesPayment
  })

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
  }

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const statusConfig = {
    pending: { label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-500" },
    processing: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-500" },
    shipping: { label: "Đang giao", color: "bg-purple-500/10 text-purple-500" },
    completed: { label: "Hoàn thành", color: "bg-green-500/10 text-green-500" },
    cancelled: { label: "Đã hủy", color: "bg-red-500/10 text-red-500" },
  }

  const paymentConfig = {
    pending: { label: "Chờ thanh toán", color: "bg-yellow-500/10 text-yellow-500" },
    paid: { label: "Đã thanh toán", color: "bg-green-500/10 text-green-500" },
    refunded: { label: "Đã hoàn tiền", color: "bg-gray-500/10 text-gray-500" },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground mt-1">Theo dõi và xử lý đơn hàng của khách hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-foreground mt-2">{orders.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Chờ xử lý</p>
          <p className="text-2xl font-bold text-yellow-500 mt-2">
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Đang xử lý</p>
          <p className="text-2xl font-bold text-blue-500 mt-2">
            {orders.filter((o) => o.status === "processing").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Đang giao</p>
          <p className="text-2xl font-bold text-purple-500 mt-2">
            {orders.filter((o) => o.status === "shipping").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-500 mt-2">
            {orders.filter((o) => o.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{order.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{order.total.toLocaleString("vi-VN")}₫</span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-primary ${statusConfig[order.status as keyof typeof statusConfig].color}`}
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipping">Đang giao</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${paymentConfig[order.payment as keyof typeof paymentConfig].color}`}
                    >
                      {paymentConfig[order.payment as keyof typeof paymentConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} order={selectedOrder} />
    </div>
  )
}
