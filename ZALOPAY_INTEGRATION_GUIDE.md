# Hướng dẫn tích hợp ZaloPay

## 🎯 Tổng quan

Hệ thống đã được tích hợp thành công phương thức thanh toán ZaloPay bên cạnh COD hiện có. Người dùng có thể chọn giữa:
- **Thanh toán COD** (tiền mặt khi nhận hàng)
- **Thanh toán ZaloPay** (thanh toán trực tuyến)

## 🔧 Cấu hình ZaloPay

### 1. Tạo tài khoản ZaloPay Sandbox

1. Truy cập [ZaloPay Developer Portal](https://developers.zalopay.vn/)
2. Đăng ký tài khoản developer
3. Tạo ứng dụng mới và lấy thông tin:
   - `App ID`
   - `Key 1` (để tạo chữ ký request)
   - `Key 2` (để xác thực callback)

### 2. Cấu hình Environment Variables

Thêm các biến sau vào file `.env`:

```env
# ZaloPay Configuration
ZALOPAY_APP_ID="your_zalopay_app_id"
ZALOPAY_KEY1="your_zalopay_key1"
ZALOPAY_KEY2="your_zalopay_key2"
ZALOPAY_CREATE_ENDPOINT="https://sb-openapi.zalopay.vn/v2/create"
ZALOPAY_SANDBOX_CALLBACK_URL="https://yourdomain.com/api/payment/zalopay/callback"

# Frontend URL (cần thiết cho return URL)
FRONTEND_URL="http://localhost:3000"
```

### 3. Cấu hình Callback URL

Trong ZaloPay Developer Portal, cấu hình callback URL:
```
https://yourdomain.com/api/payment/zalopay/callback
```

## 🚀 Luồng hoạt động

### Luồng thanh toán ZaloPay:

1. **Người dùng chọn ZaloPay** → Frontend gọi API tạo đơn hàng với `paymentMethod: "ZALOPAY"`
2. **Tạo đơn hàng** → Backend lưu đơn hàng với trạng thái `PENDING`
3. **Tạo ZaloPay Order** → Frontend gọi `/api/payment/zalopay/create-order`
4. **Redirect đến ZaloPay** → Người dùng được chuyển hướng đến trang thanh toán ZaloPay
5. **Thanh toán thành công** → ZaloPay gọi callback `/api/payment/zalopay/callback`
6. **Xác thực và cập nhật** → Backend xác thực chữ ký và cập nhật đơn hàng thành `PAID`
7. **Tạo đơn GHN** → Tự động tạo đơn vận chuyển GHN
8. **Redirect về trang thành công** → Người dùng được chuyển về `/payment/success`

## 📁 Files đã được tạo/cập nhật

### Backend:
- `backend/services/zalopayService.js` - Service xử lý API ZaloPay
- `backend/controllers/zalopayController.js` - Controller xử lý logic ZaloPay
- `backend/routes/zalopay.js` - Routes cho ZaloPay endpoints
- `backend/server.js` - Thêm ZaloPay routes
- `backend/controllers/orderController.js` - Cập nhật hỗ trợ ZaloPay
- `prisma/schema.prisma` - Thêm enum PaymentMethod
- `prisma/migrations/20251029000141_add_zalopay_payment_method/` - Migration database

### Frontend:
- `src/app/checkout/page.tsx` - Thêm tùy chọn ZaloPay
- `src/app/payment/success/page.tsx` - Trang thành công thanh toán

### Configuration:
- `env.example` - Template cấu hình environment
- `package.json` - Thêm dependency axios

## 🧪 Cách test

### 1. Test tạo đơn hàng ZaloPay

```bash
# Start backend
npm run server

# Start frontend
npm run dev
```

1. Truy cập trang checkout
2. Chọn "Thanh toán bằng ZaloPay"
3. Điền thông tin giao hàng
4. Click "Thanh toán ZaloPay"
5. Kiểm tra console để xem log

### 2. Test callback ZaloPay

Sử dụng ngrok để expose local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 4000 (backend)
ngrok http 4000
```

Cập nhật callback URL trong ZaloPay Developer Portal với URL ngrok.

### 3. Test với Postman

**Tạo đơn hàng ZaloPay:**
```http
POST http://localhost:4000/api/payment/zalopay/create-order
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "orderId": "order_id_from_database",
  "amount": 100000,
  "description": "Test ZaloPay order",
  "returnUrl": "http://localhost:3000/payment/success"
}
```

**Kiểm tra trạng thái:**
```http
GET http://localhost:4000/api/payment/zalopay/status/ORDER_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔍 Debug và Troubleshooting

### 1. Kiểm tra logs

Backend logs sẽ hiển thị:
- ZaloPay API requests/responses
- Callback verification
- GHN order creation

### 2. Lỗi thường gặp

**Lỗi chữ ký không hợp lệ:**
- Kiểm tra Key1 và Key2 trong .env
- Đảm bảo thứ tự parameters đúng

**Lỗi callback không được gọi:**
- Kiểm tra callback URL trong ZaloPay Developer Portal
- Sử dụng ngrok để expose local server

**Lỗi GHN không tạo được đơn:**
- Kiểm tra cấu hình GHN
- Kiểm tra thông tin địa chỉ giao hàng

### 3. Database

Kiểm tra trạng thái đơn hàng trong database:
```sql
SELECT id, paymentMethod, paymentStatus, status, transactionId, ghnOrderCode 
FROM "Order" 
WHERE paymentMethod = 'ZALOPAY';
```

## 📋 Checklist triển khai

- [ ] Cấu hình ZaloPay sandbox account
- [ ] Thêm environment variables
- [ ] Cấu hình callback URL
- [ ] Test tạo đơn hàng ZaloPay
- [ ] Test callback từ ZaloPay
- [ ] Test tích hợp GHN
- [ ] Test trang success
- [ ] Deploy lên production
- [ ] Cấu hình production callback URL

## 🔒 Bảo mật

- **Key1 và Key2**: Giữ bí mật, không commit vào git
- **Callback verification**: Luôn xác thực chữ ký từ ZaloPay
- **HTTPS**: Sử dụng HTTPS cho production
- **Environment variables**: Sử dụng biến môi trường cho tất cả secrets

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs backend
2. Kiểm tra network requests trong browser dev tools
3. Kiểm tra database trạng thái đơn hàng
4. Tham khảo [ZaloPay API Documentation](https://developers.zalopay.vn/docs/api/)
