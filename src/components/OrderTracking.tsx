"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface OrderTrackingProps {
  trackingOrder: string
  onClose?: () => void
}

interface TrackingData {
  success: boolean
  message: string
  order: {
    label_id: string
    partner_id: string
    status: string
    status_text: string
    created: string
    modified: string
    message: string
    pick_date: string
    deliver_date: string
    customer_fullname: string
    customer_tel: string
    address: string
    storage_day: string
    ship_money: string
    insurance: string
    value: string
    weight: string
    pick_money: string
    is_freeship: string
  }
}

export function OrderTracking({ trackingOrder, onClose }: OrderTrackingProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (trackingOrder) {
      fetchTrackingData()
    }
  }, [trackingOrder])

  const fetchTrackingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/shipping/track/${trackingOrder}`)
      setTrackingData(response.data)
    } catch (error) {
      console.error('Error fetching tracking data:', error)
      setError('Không thể lấy thông tin theo dõi đơn hàng')
      toast.error('Không thể lấy thông tin theo dõi đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const formatVND = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseInt(value) : value
    return numValue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật'
    return new Date(dateString).toLocaleString('vi-VN')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Đang tải thông tin...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !trackingData?.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Không thể lấy thông tin đơn hàng'}</p>
            <Button onClick={fetchTrackingData} variant="outline">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const order = trackingData.order

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Thông tin đơn hàng</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mã đơn hàng GHTK</p>
              <p className="font-mono text-sm">{order.label_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mã đơn hàng đối tác</p>
              <p className="font-mono text-sm">{order.partner_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Trạng thái:</p>
            <OrderStatusBadge status={order.status} statusText={order.status_text} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ngày tạo</p>
              <p className="text-sm">{formatDate(order.created)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cập nhật cuối</p>
              <p className="text-sm">{formatDate(order.modified)}</p>
            </div>
          </div>

          {order.message && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
              <p className="text-sm">{order.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin giao hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Người nhận</p>
            <p className="font-medium">{order.customer_fullname}</p>
            <p className="text-sm text-muted-foreground">{order.customer_tel}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Địa chỉ giao hàng</p>
            <p className="text-sm">{order.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ngày lấy hàng</p>
              <p className="text-sm">{order.pick_date || 'Chưa cập nhật'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ngày giao hàng</p>
              <p className="text-sm">{order.deliver_date || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết phí</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Phí vận chuyển</span>
            <span className="text-sm font-medium">{formatVND(order.ship_money)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Phí bảo hiểm</span>
            <span className="text-sm font-medium">{formatVND(order.insurance)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tiền thu hộ (COD)</span>
            <span className="text-sm font-medium">{formatVND(order.pick_money)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Giá trị hàng hóa</span>
            <span className="text-sm font-medium">{formatVND(order.value)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Trọng lượng</span>
            <span className="text-sm font-medium">{order.weight}g</span>
          </div>

          {order.is_freeship === "1" && (
            <div className="flex justify-between">
              <span className="text-sm text-green-600">Miễn phí vận chuyển</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Freeship
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={fetchTrackingData} variant="outline">
          Cập nhật thông tin
        </Button>
      </div>
    </div>
  )
}
