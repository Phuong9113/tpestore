"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface Order {
  id: string
  totalPrice: number
  status: string
  user: {
    name: string
  }
}

const statusConfig = {
  COMPLETED: { label: "Hoàn thành", color: "bg-green-500/10 text-green-500" },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-500" },
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-500" },
  SHIPPING: { label: "Đang giao", color: "bg-purple-500/10 text-purple-500" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-500/10 text-red-500" },
}

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentOrders()
  }, [])

  const fetchRecentOrders = async () => {
    try {
      const response = await api.get('/admin/orders?limit=5')
      setOrders(response.orders)
    } catch (error) {
      console.error('Error fetching recent orders:', error)
    } finally {
      setLoading(false)
    }
  }
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
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{order.id}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{order.user.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">{order.totalPrice.toLocaleString("vi-VN")}₫</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-500/10 text-gray-500'}`}
                >
                  {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
