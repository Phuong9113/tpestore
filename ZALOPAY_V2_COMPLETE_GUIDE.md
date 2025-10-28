# ZaloPay Gateway v2 Integration - Complete Guide

## 🎯 Tổng quan

Hệ thống đã được tích hợp hoàn chỉnh **ZaloPay Gateway v2** với tất cả các tính năng theo yêu cầu:

### ✅ Đã hoàn thành

1. **Tạo đơn ZaloPay v2**:
   - ✅ `app_trans_id` theo format: `yyMMdd_randomNumber` (6 số + 5 số)
   - ✅ `embed_data` sử dụng `redirecturl` thay vì `returnUrl`
   - ✅ MAC ký theo đúng thứ tự v2: `app_id|app_trans_id|app_user|amount|app_time|embed_data|item`
   - ✅ Sử dụng `ZALOPAY_KEY1` với HmacSHA256
   - ✅ Gửi request với `application/x-www-form-urlencoded`
   - ✅ Giữ nguyên tính năng COD và GHN

2. **Xử lý redirect sau thanh toán**:
   - ✅ Trang `/payment/verify` nhận `zp_trans_token` từ query params
   - ✅ Frontend gọi backend để verify trạng thái thanh toán
   - ✅ Redirect về `/payment/success` sau khi verify thành công

3. **Xử lý callback server-to-server**:
   - ✅ Endpoint `/api/payment/zalopay/callback` nhận `zp_trans_token`
   - ✅ Verify MAC với `ZALOPAY_KEY2`
   - ✅ Cập nhật trạng thái đơn hàng khi verify thành công
   - ✅ Callback URL HTTPS được cấu hình từ environment

4. **Verify thanh toán backend**:
   - ✅ Endpoint `/api/payment/zalopay/verify` gọi `/v2/query`
   - ✅ Kiểm tra `return_code === 1 && sub_return_code === 1`
   - ✅ Cập nhật database và trả kết quả cho frontend
   - ✅ Xử lý lỗi và log đầy đủ

5. **Giao diện frontend**:
   - ✅ Hiển thị chính xác "Thanh toán thành công" hoặc "Thanh toán thất bại"
   - ✅ Không hiển thị thất bại nếu transaction thực sự thành công
   - ✅ Trang verify với loading states và error handling

6. **Bảo mật**:
   - ✅ `ZALOPAY_KEY1`/`KEY2` chỉ sử dụng trên backend
   - ✅ MAC ký và verify token chỉ trên backend
   - ✅ Authentication middleware cho các endpoint cần thiết

## 🔧 Cấu hình Environment

### 1. ZaloPay Sandbox Credentials

```env
# ZaloPay Gateway v2 Configuration
ZALOPAY_APP_ID="2554"
ZALOPAY_KEY1="sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn"
ZALOPAY_KEY2="trMrHtvjo6myautxDUiAcYsVtaeQ8nhf"
ZALOPAY_CREATE_ENDPOINT="https://sb-openapi.zalopay.vn/v2/create"
ZALOPAY_SANDBOX_CALLBACK_URL="https://yourdomain.com/api/payment/zalopay/callback"

# Frontend URL (cần thiết cho redirecturl)
FRONTEND_URL="http://localhost:3000"
```

### 2. ZaloPay Developer Portal Setup

1. **Truy cập** [ZaloPay Developer Portal](https://developers.zalopay.vn/)
2. **Đăng nhập** với tài khoản sandbox
3. **Cấu hình Callback URL**:
   ```
   https://yourdomain.com/api/payment/zalopay/callback
   ```
4. **Lấy credentials** từ portal và cập nhật `.env`

## 🚀 Luồng hoạt động ZaloPay v2

### 1. **Tạo đơn hàng**
```javascript
// Frontend gọi API tạo đơn
POST /api/payment/zalopay/create-order
{
  "orderId": "order_123",
  "amount": 100000,
  "description": "Thanh toán đơn hàng",
  "returnUrl": "https://domain.com/payment/verify"
}
```

### 2. **Backend xử lý**
```javascript
// Tạo app_trans_id theo chuẩn v2
const appTransId = "250128_12345"; // yyMMdd_randomNumber

// Chuẩn bị embed_data với redirecturl
const embedData = {
  orderId: "order_123",
  redirecturl: "https://domain.com/payment/verify"
};

// Tạo MAC theo thứ tự v2
const rawData = "app_id|app_trans_id|app_user|amount|app_time|embed_data|item";
const mac = crypto.createHmac('sha256', ZALOPAY_KEY1).update(rawData).digest('hex');
```

### 3. **Redirect và Verify**
```javascript
// ZaloPay redirect về với zp_trans_token
// URL: https://domain.com/payment/verify?zp_trans_token=xxx&orderId=xxx

// Frontend gọi backend verify
POST /api/payment/zalopay/verify
{
  "zp_trans_token": "xxx",
  "orderId": "order_123"
}
```

### 4. **Callback Server-to-Server**
```javascript
// ZaloPay gọi callback
POST /api/payment/zalopay/callback
{
  "data": "{\"orderId\":\"order_123\",\"redirecturl\":\"...\"}",
  "mac": "signature_with_key2",
  "type": 1,
  "code": 1,
  "message": "success"
}
```

## 📁 Files đã tạo/sửa đổi

### Backend Files
- `backend/services/zalopayService.js` - Service xử lý ZaloPay API
- `backend/controllers/zalopayController.js` - Controller xử lý requests
- `backend/routes/zalopay.js` - Routes định nghĩa endpoints
- `backend/server.js` - Đã thêm ZaloPay routes

### Frontend Files
- `src/app/payment/verify/page.tsx` - Trang verify thanh toán (MỚI)
- `src/app/payment/success/page.tsx` - Trang thành công (ĐÃ SỬA)
- `src/app/checkout/page.tsx` - Trang checkout (ĐÃ SỬA)

### Database
- `prisma/schema.prisma` - Thêm PaymentMethod enum
- `prisma/migrations/` - Migration cho PaymentMethod

### Test & Documentation
- `test-zalopay-v2-integration.js` - Script test integration
- `ZALOPAY_V2_GUIDE.md` - Hướng dẫn chi tiết

## 🧪 Testing

### 1. Chạy Test Script
```bash
node test-zalopay-v2-integration.js
```

### 2. Test Manual Flow
1. **Tạo đơn hàng** với paymentMethod: "ZALOPAY"
2. **Chọn ZaloPay** trên checkout page
3. **Redirect đến ZaloPay** sandbox
4. **Thanh toán thành công** trên ZaloPay
5. **Redirect về verify page** với zp_trans_token
6. **Verify thành công** và redirect đến success page
7. **Kiểm tra database** - order status = PAID
8. **Kiểm tra GHN order** được tạo tự động

## 🔍 Debugging

### 1. Kiểm tra Logs
```bash
# Backend logs
npm run server

# Frontend logs
npm run dev
```

### 2. Common Issues
- **App Trans ID format**: Phải đúng `yyMMdd_xxxxx`
- **MAC signature**: Phải đúng thứ tự parameters
- **Content-Type**: Phải là `application/x-www-form-urlencoded`
- **Callback URL**: Phải HTTPS và whitelisted
- **Environment variables**: Phải đúng credentials

### 3. ZaloPay API Responses
```javascript
// Success response
{
  "return_code": 1,
  "sub_return_code": 1,
  "return_message": "success",
  "sub_return_message": "success",
  "order_url": "https://sb.zalopay.vn/pay/...",
  "app_trans_id": "250128_12345"
}

// Error response
{
  "return_code": 2,
  "sub_return_code": -401,
  "return_message": "Dữ liệu yêu cầu không hợp lệ",
  "sub_return_message": "Invalid request data"
}
```

## 🎉 Kết quả

Hệ thống ZaloPay Gateway v2 đã hoạt động hoàn chỉnh với:

- ✅ **Tạo đơn** với format v2 chuẩn
- ✅ **Redirect** về trang verify
- ✅ **Verify** với zp_trans_token
- ✅ **Callback** server-to-server
- ✅ **Cập nhật database** tự động
- ✅ **Tạo GHN order** sau thanh toán
- ✅ **UI/UX** mượt mà và user-friendly
- ✅ **Error handling** đầy đủ
- ✅ **Security** đảm bảo
- ✅ **Documentation** chi tiết

Người dùng có thể thanh toán bằng ZaloPay một cách an toàn và tin cậy! 🚀
