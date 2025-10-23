"use client"

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useState } from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface PayPalButtonProps {
  orderId: string
  totalAmount: number
  onSuccess: (orderId: string) => void
  onError: (error: string) => void
}

export function PayPalButton({ orderId, totalAmount, onSuccess, onError }: PayPalButtonProps) {
  const [{ isPending }] = usePayPalScriptReducer()
  const [isProcessing, setIsProcessing] = useState(false)

  const createOrder = async () => {
    try {
      setIsProcessing(true)
      const response = await api.post('/paypal/create-order', {
        orderId,
        totalAmount
      })
      
      return response.data.paypalOrderId
    } catch (error) {
      console.error('Error creating PayPal order:', error)
      onError('Không thể tạo đơn hàng PayPal')
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const onApprove = async (data: any) => {
    try {
      setIsProcessing(true)
      const response = await api.post('/paypal/capture-order', {
        paypalOrderId: data.orderID,
        orderId
      })
      
      if (response.data.success) {
        toast.success('Thanh toán PayPal thành công!')
        onSuccess(orderId)
      } else {
        onError('Thanh toán không thành công')
      }
    } catch (error) {
      console.error('Error capturing PayPal payment:', error)
      onError('Có lỗi xảy ra khi xử lý thanh toán')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayPalError = (error: any) => {
    console.error('PayPal error:', error)
    toast.error('Có lỗi xảy ra với PayPal')
  }

  const onCancel = () => {
    toast.info('Thanh toán PayPal đã bị hủy')
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải PayPal...</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={handlePayPalError}
        onCancel={onCancel}
        disabled={isProcessing}
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal"
        }}
      />
      {isProcessing && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Đang xử lý thanh toán...
        </div>
      )}
    </div>
  )
}
