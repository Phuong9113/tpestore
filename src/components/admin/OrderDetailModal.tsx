"use client"

import { XMarkIcon, TruckIcon } from "@heroicons/react/24/outline"

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
}

export default function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  if (!isOpen || !order) return null

  const statusConfig = {
    pending: { label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-500" },
    processing: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-500" },
    shipping: { label: "Đang giao", color: "bg-purple-500/10 text-purple-500" },
    completed: { label: "Hoàn thành", color: "bg-green-500/10 text-green-500" },
    cancelled: { label: "Đã hủy", color: "bg-red-500/10 text-red-500" },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground">Chi tiết đơn hàng {order.id}</h2>
            <p className="text-sm text-muted-foreground mt-1">{order.date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái đơn hàng</p>
              <span
                className={`inline-block mt-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[order.status as keyof typeof statusConfig].color}`}
              >
                {statusConfig[order.status as keyof typeof statusConfig].label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tổng tiền</p>
              <p className="text-2xl font-bold text-foreground mt-1">{order.total.toLocaleString("vi-VN")}₫</p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Thông tin khách hàng</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Họ tên:</span>
                <span className="text-sm font-medium text-foreground">{order.customer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium text-foreground">{order.customer.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Số điện thoại:</span>
                <span className="text-sm font-medium text-foreground">{order.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Thông tin giao hàng
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Địa chỉ:</span>
                <span className="text-sm font-medium text-foreground text-right max-w-xs">
                  {order.shipping.address}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phương thức:</span>
                <span className="text-sm font-medium text-foreground">{order.shipping.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phí vận chuyển:</span>
                <span className="text-sm font-medium text-foreground">
                  {order.shipping.fee.toLocaleString("vi-VN")}₫
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Sản phẩm</h3>
            <div className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Số lượng: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.price.toLocaleString("vi-VN")}₫</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-border pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tạm tính:</span>
                <span className="text-sm text-foreground">
                  {(order.total - order.shipping.fee).toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phí vận chuyển:</span>
                <span className="text-sm text-foreground">{order.shipping.fee.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-base font-semibold text-foreground">Tổng cộng:</span>
                <span className="text-lg font-bold text-primary">{order.total.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              In đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
