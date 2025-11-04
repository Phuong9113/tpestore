"use client"

import { useState, useEffect } from "react"
import { XMarkIcon, TruckIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline"
import { api } from "@/lib/api"

interface GHNOrderDetailProps {
  orderCode: string
  isOpen: boolean
  onClose: () => void
}

interface GHNOrderData {
  order_code: string
  status: string
  currentStatus?: string
  to_name: string
  to_phone: string
  to_address: string
  from_name: string
  from_phone: string
  from_address: string
  cod_amount: number
  service_type_id: number
  weight: number
  length: number
  width: number
  height: number
  created_date: string
  updated_date: string
  leadtime: number
  order_date: string
  finish_date?: string
  required_note: string
  note?: string
  content?: string
  log?: Array<{ status: string; payment_type_id?: string | number; updated_date: string }>
}

export default function GHNOrderDetail({ orderCode, isOpen, onClose }: GHNOrderDetailProps) {
  const [orderData, setOrderData] = useState<GHNOrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && orderCode) {
      fetchGHNOrderDetail()
    }
  }, [isOpen, orderCode])

  const fetchGHNOrderDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/admin/orders/ghn/${orderCode}`)
      setOrderData(response.data.data)
    } catch (err) {
      console.error('Error fetching GHN order detail:', err)
      setError('Không thể tải chi tiết đơn hàng GHN')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'ready_to_pick': 'Sẵn sàng lấy hàng',
      'picking': 'Đang lấy hàng',
      'picked': 'Đã lấy hàng',
      'storing': 'Đang lưu kho',
      'transporting': 'Đang vận chuyển',
      'sorting': 'Đang phân loại',
      'delivering': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'delivery_fail': 'Giao hàng thất bại',
      'waiting_to_return': 'Chờ trả hàng',
      'return': 'Đang trả hàng',
      'returned': 'Đã trả hàng',
      'exception': 'Ngoại lệ',
      'damage': 'Hàng hóa bị hỏng',
      'lost': 'Hàng hóa bị mất',
      'cancel': 'Hủy đơn hàng'
    }
    return statusMap[status] || status
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground">Chi tiết đơn hàng GHN</h2>
            <p className="text-sm text-muted-foreground mt-1">Mã đơn: {orderCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : orderData ? (
            <>
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <span className="inline-block mt-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-500/10 text-blue-500">
                    {getStatusText((orderData.currentStatus || orderData.status) as string)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">COD</p>
                  <p className="text-lg font-bold text-foreground">{orderData.cod_amount?.toLocaleString("vi-VN")}₫</p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Receiver Info */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TruckIcon className="w-5 h-5" />
                    Thông tin người nhận
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tên:</span>
                      <span className="text-sm font-medium text-foreground">{orderData.to_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{orderData.to_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm font-medium text-foreground">{orderData.to_address}</span>
                    </div>
                  </div>
                </div>

                {/* Sender Info */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TruckIcon className="w-5 h-5" />
                    Thông tin người gửi
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tên:</span>
                      <span className="text-sm font-medium text-foreground">{orderData.from_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{orderData.from_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm font-medium text-foreground">{orderData.from_address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Thông tin hàng hóa</h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cân nặng</p>
                      <p className="text-sm font-medium text-foreground">{orderData.weight}g</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Chiều dài</p>
                      <p className="text-sm font-medium text-foreground">{orderData.length}cm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Chiều rộng</p>
                      <p className="text-sm font-medium text-foreground">{orderData.width}cm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Chiều cao</p>
                      <p className="text-sm font-medium text-foreground">{orderData.height}cm</p>
                    </div>
                  </div>
                  {orderData.content && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Nội dung</p>
                      <p className="text-sm font-medium text-foreground">{orderData.content}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Timeline</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ngày tạo:</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(orderData.created_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cập nhật cuối:</span>
                    <span className="text-sm font-medium text-foreground">{formatDate(orderData.updated_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Thời gian giao dự kiến:</span>
                    <span className="text-sm font-medium text-foreground">{orderData.leadtime} giờ</span>
                  </div>
                  {orderData.finish_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ngày giao:</span>
                      <span className="text-sm font-medium text-foreground">{formatDate(orderData.finish_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {(orderData.required_note || orderData.note) && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Ghi chú</h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    {orderData.required_note && (
                      <div>
                        <p className="text-sm text-muted-foreground">Ghi chú bắt buộc:</p>
                        <p className="text-sm font-medium text-foreground">{orderData.required_note}</p>
                      </div>
                    )}
                    {orderData.note && (
                      <div>
                        <p className="text-sm text-muted-foreground">Ghi chú:</p>
                        <p className="text-sm font-medium text-foreground">{orderData.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
