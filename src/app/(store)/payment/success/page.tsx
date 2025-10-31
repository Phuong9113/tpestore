"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get order ID from URL params or localStorage
        const orderId = searchParams.get('orderId') || localStorage.getItem('lastOrderId');
        const verified = searchParams.get('verified'); // Check if already verified from verify page
        const redirectStatus = searchParams.get('status'); // ZaloPay redirect status ("1" for success)
        
        if (!orderId) {
          setPaymentStatus('failed');
          return;
        }

        // If already verified from verify page, show success immediately
        if (verified === 'true') {
          setPaymentStatus('success');
          const response = await api.get(`/zalopay/status/${orderId}`);
          setOrderInfo(response);
          toast.success("Thanh toán thành công!");
          return;
        }

        // One-time check payment status from backend (no polling)
        let response = await api.get(`/zalopay/status/${orderId}`);
        let payload: any = response?.data ?? response;
        
        console.log('Payment status response:', response);
        
        if (payload.paymentStatus === 'PAID' || payload?.order?.paymentStatus === 'PAID') {
          setPaymentStatus('success');
          setOrderInfo(payload);
          toast.success("Thanh toán thành công!");
        } else {
          // If ZaloPay redirected with status=1, the callback may arrive slightly later.
          if (redirectStatus === '1') {
            // Quick single retry after a short delay
            await new Promise((r) => setTimeout(r, 2000));
            response = await api.get(`/zalopay/status/${orderId}`);
            payload = response?.data ?? response;
            if (payload.paymentStatus === 'PAID' || payload?.order?.paymentStatus === 'PAID') {
              setPaymentStatus('success');
              setOrderInfo(payload);
              toast.success("Thanh toán thành công!");
              return;
            }
          }
          setPaymentStatus('failed');
          toast.error("Thanh toán chưa được xác nhận");
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentStatus('failed');
        toast.error("Không thể kiểm tra trạng thái thanh toán");
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleContinueShopping = () => {
    router.push('/products');
  };

  const handleViewOrders = () => {
    router.push('/profile?tab=orders');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {paymentStatus === 'loading' && (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            )}
            {paymentStatus === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {paymentStatus === 'failed' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {paymentStatus === 'loading' && 'Đang xác nhận thanh toán...'}
            {paymentStatus === 'success' && 'Thanh toán thành công!'}
            {paymentStatus === 'failed' && 'Thanh toán thất bại'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {paymentStatus === 'success' && orderInfo && (
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Đơn hàng của bạn đã được thanh toán thành công
              </p>
              {(orderInfo.ghnOrderCode || orderInfo.order?.ghnOrderCode) && (
                <p className="text-sm text-muted-foreground">
                  Mã vận chuyển: {orderInfo.ghnOrderCode || orderInfo.order?.ghnOrderCode}
                </p>
              )}
              {!(orderInfo.ghnOrderCode || orderInfo.order?.ghnOrderCode) && (
                <p className="text-sm text-yellow-600">
                  ⚠️ Mã vận chuyển đang được tạo...
                </p>
              )}
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Thanh toán không thành công hoặc đã bị hủy
              </p>
              <p className="text-sm text-muted-foreground">
                Vui lòng thử lại hoặc liên hệ hỗ trợ
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleContinueShopping}
              className="w-full"
            >
              Tiếp tục mua sắm
            </Button>
            
            {paymentStatus === 'success' && (
              <Button 
                variant="outline"
                onClick={handleViewOrders}
                className="w-full"
              >
                Xem đơn hàng
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
