# PayPal Integration Setup

## 1. Tạo PayPal Developer Account

1. Truy cập [PayPal Developer](https://developer.paypal.com/)
2. Đăng nhập hoặc tạo tài khoản PayPal
3. Vào "My Apps & Credentials"
4. Tạo "New App" với các thông tin:
   - App Name: TPE Store
   - Merchant: Personal Account (hoặc Business Account)
   - Sandbox: Yes (cho testing)

## 2. Lấy Credentials

Sau khi tạo app, bạn sẽ có:
- **Client ID**: Copy và lưu lại
- **Client Secret**: Copy và lưu lại

## 3. Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID="your-sandbox-client-id"
PAYPAL_CLIENT_SECRET="your-sandbox-client-secret"
PAYPAL_ENV="sandbox"
PAYPAL_CURRENCY="USD"

# Frontend URL (for PayPal redirects)
FRONTEND_URL="http://localhost:3000"
```

## 4. Cấu hình Frontend

Thêm vào file `.env.local` (hoặc `.env`):

```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-sandbox-client-id"
```

## 5. Test với Sandbox

1. Chạy ứng dụng: `npm run dev:full`
2. Vào trang checkout
3. Chọn "Thanh toán qua PayPal"
4. Sử dụng sandbox buyer account để test:
   - Email: sb-buyer@personal.example.com
   - Password: (tạo trong PayPal Developer Dashboard)

## 6. Chuyển sang Live (Production)

Khi sẵn sàng go-live:

1. Tạo Live App trong PayPal Developer
2. Cập nhật environment variables:
   ```env
   PAYPAL_ENV="live"
   PAYPAL_CLIENT_ID="your-live-client-id"
   PAYPAL_CLIENT_SECRET="your-live-client-secret"
   ```
3. Cập nhật frontend:
   ```env
   NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-live-client-id"
   ```

## 7. Lưu ý quan trọng

- **Currency**: Hiện tại sử dụng USD, có thể thay đổi trong `PAYPAL_CURRENCY`
- **Exchange Rate**: Tự động convert VND sang USD với tỷ giá 1 USD = 24,000 VND
- **Security**: Không bao giờ commit credentials vào git
- **Webhook**: Có thể thêm webhook để xử lý refunds/disputes sau này

## 8. Test Integration

### Test Backend Connection
```bash
node test-paypal-integration.js
```

### Test Full Flow
1. Chạy ứng dụng: `npm run dev:full`
2. Đăng nhập và thêm sản phẩm vào giỏ
3. Vào checkout, chọn "Thanh toán qua PayPal"
4. Click "Tạo đơn hàng PayPal"
5. Click nút PayPal để thanh toán
6. Sử dụng sandbox buyer account

### Sandbox Test Accounts
Tạo trong PayPal Developer Dashboard:
- **Buyer Account**: sb-buyer@personal.example.com
- **Password**: (tự đặt khi tạo account)

## 9. Troubleshooting

### Lỗi "PayPal Client ID not configured"
- Kiểm tra `NEXT_PUBLIC_PAYPAL_CLIENT_ID` trong `.env.local`
- Restart development server

### Lỗi "PayPal credentials not configured"
- Kiểm tra `PAYPAL_CLIENT_ID` và `PAYPAL_CLIENT_SECRET` trong `.env`
- Restart backend server

### Lỗi "Amount mismatch"
- Kiểm tra tỷ giá exchange rate trong `paypalController.js`
- Đảm bảo totalAmount được tính đúng

### Lỗi "Order not found or already processed"
- Kiểm tra orderId có đúng không
- Kiểm tra order chưa được thanh toán
- Kiểm tra user có quyền truy cập order không

### PayPal Button không hiển thị
- Kiểm tra `NEXT_PUBLIC_PAYPAL_CLIENT_ID` có đúng không
- Kiểm tra console có lỗi JavaScript không
- Kiểm tra network tab có request lỗi không
