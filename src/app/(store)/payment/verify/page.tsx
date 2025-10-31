"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

/**
 * Trang verify thanh toán ZaloPay v2
 * 
 * Theo tài liệu ZaloPay, sau khi thanh toán thành công:
 * 1. ZaloPay gọi callback đến backend
 * 2. Frontend cần polling để kiểm tra trạng thái
 * 3. Không có redirect với zp_trans_token
 */
export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pollCount, setPollCount] = useState(0);
  const maxPollAttempts = 30; // Poll trong 5 phút (30 * 10s)

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      setVerificationStatus('failed');
      setErrorMessage('Thiếu thông tin đơn hàng');
      return;
    }
    // Bỏ polling: chuyển thẳng sang trang success, backend sẽ cập nhật nhờ callback
    router.replace(`/payment/success?orderId=${orderId}`);
  }, [searchParams, router]);

  // Polling đã được loại bỏ theo luồng callback

  const handleRetryPayment = () => {
    router.push('/checkout');
  };

  const handleContactSupport = () => {
    window.open('mailto:support@tpestore.com', '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationStatus === 'loading' && (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {verificationStatus === 'failed' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verificationStatus === 'loading' && 'Đang xác thực thanh toán...'}
            {verificationStatus === 'success' && 'Xác thực thành công!'}
            {verificationStatus === 'failed' && 'Xác thực thất bại'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {verificationStatus === 'loading' && (
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Đang kiểm tra trạng thái thanh toán với ZaloPay...
              </p>
              <p className="text-sm text-muted-foreground">
                Lần kiểm tra: {pollCount + 1}/{maxPollAttempts}
              </p>
              <p className="text-sm text-muted-foreground">
                Vui lòng chờ trong giây lát
              </p>
            </div>
          )}

          {verificationStatus === 'success' && orderInfo && (
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Thanh toán đã được xác thực thành công
              </p>
              <p className="font-medium">
                Mã đơn hàng: {orderInfo.orderId}
              </p>
              {orderInfo.ghnOrderCode && (
                <p className="text-sm text-muted-foreground">
                  Mã vận chuyển: {orderInfo.ghnOrderCode}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Đang chuyển hướng đến trang thành công...
              </p>
            </div>
          )}
          
          {verificationStatus === 'failed' && (
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                {errorMessage || 'Không thể xác thực thanh toán'}
              </p>
              <p className="text-sm text-muted-foreground">
                Vui lòng thử lại hoặc liên hệ hỗ trợ
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-3">
            {verificationStatus === 'failed' && (
              <>
                <Button 
                  onClick={handleRetryPayment}
                  className="w-full"
                >
                  Thử lại thanh toán
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleContactSupport}
                  className="w-full"
                >
                  Liên hệ hỗ trợ
                </Button>
              </>
            )}
            
            {verificationStatus === 'success' && (
              <Button 
                onClick={() => router.push('/products')}
                className="w-full"
              >
                Tiếp tục mua sắm
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
