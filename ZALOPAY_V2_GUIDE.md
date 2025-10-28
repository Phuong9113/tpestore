# ZaloPay Gateway v2 Integration Guide

## 🎯 Tổng quan

Hệ thống đã được tích hợp thành công **ZaloPay Gateway v2** với các tính năng:

- ✅ **app_trans_id** theo chuẩn v2: `yyMMdd_randomNumber`
- ✅ **embed_data** sử dụng `redirecturl` thay vì `returnUrl`
- ✅ **MAC** ký theo đúng thứ tự v2: `app_id|app_trans_id|app_user|amount|app_time|embed_data|item`
- ✅ **callback_url** HTTPS hợp lệ từ environment
- ✅ **Error handling** và logging đầy đủ
- ✅ **Sandbox testing** sẵn sàng

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
  "returnUrl": "https://domain.com/payment/success"
}
```

### 2. **Backend xử lý**
```javascript
// Tạo app_trans_id theo chuẩn v2
const appTransId = "250128_12345"; // yyMMdd_randomNumber

// Chuẩn bị embed_data với redirecturl
const embedData = {
  orderId: "order_123",
  redirecturl: "https://domain.com/payment/success"
};

// Tạo MAC theo thứ tự v2
const rawData = "app_id|app_trans_id|app_user|amount|app_time|embed_data|item";
const mac = crypto.createHmac('sha256', key1).update(rawData).digest('hex');
```

### 3. **Gọi ZaloPay API**
```javascript
// Request đến ZaloPay v2
POST https://sb-openapi.zalopay.vn/v2/create
Content-Type: application/x-www-form-urlencoded

{
  "app_id": 2554,
  "app_time": 1761674161940,
  "app_trans_id": "250128_12345",
  "app_user": "TPE_Store",
  "bank_code": "",
  "description": "Thanh toán đơn hàng",
  "amount": 100000,
  "embed_data": "{\"orderId\":\"order_123\",\"redirecturl\":\"https://domain.com/success\"}",
  "item": "[{\"itemid\":\"1\",\"itemname\":\"Product\",\"itemprice\":100000,\"itemquantity\":1}]",
  "callback_url": "https://yourdomain.com/api/payment/zalopay/callback",
  "mac": "generated_mac_hash"
}
```

### 4. **Response từ ZaloPay**
```javascript
// Thành công
{
  "return_code": 1,
  "return_message": "Giao dịch thành công",
  "sub_return_code": 1,
  "sub_return_message": "Giao dịch thành công",
  "zp_trans_token": "AC5TYXNLtPgMkO-IBA2_VoBA",
  "order_url": "https://qcgateway.zalopay.vn/openinapp?order=...",
  "order_token": "AC5TYXNLtPgMkO-IBA2_VoBA",
  "qr_code": "00020101021226520010vn.zalopay..."
}
```

### 5. **Redirect người dùng**
```javascript
// Frontend redirect đến ZaloPay
window.location.href = response.order_url;
```

### 6. **Callback từ ZaloPay**
```javascript
// ZaloPay gọi callback sau khi thanh toán
POST https://yourdomain.com/api/payment/zalopay/callback
{
  "data": "{\"orderId\":\"order_123\",\"amount\":100000}",
  "mac": "callback_mac_hash",
  "type": "payment",
  "code": 1,
  "message": "success"
}
```

## 📋 Format chuẩn ZaloPay v2

### 1. **app_trans_id**
```javascript
// Format: yyMMdd_randomNumber
// Ví dụ: 250128_12345 (28/01/2025 + random 5 số)
const year = date.getFullYear().toString().slice(-2);
const month = (date.getMonth() + 1).toString().padStart(2, '0');
const day = date.getDate().toString().padStart(2, '0');
const randomNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
const appTransId = `${year}${month}${day}_${randomNumber}`;
```

### 2. **embed_data**
```javascript
// Sử dụng "redirecturl" thay vì "returnUrl"
const embedData = {
  orderId: "order_123",
  redirecturl: "https://domain.com/payment/success"
};
```

### 3. **MAC Generation**
```javascript
// Thứ tự cố định: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
const rawData = `${app_id}|${app_trans_id}|${app_user}|${amount}|${app_time}|${embed_data}|${item}`;
const mac = crypto.createHmac('sha256', key1).update(rawData).digest('hex');
```

## 🧪 Testing

### 1. **Test tự động**
```bash
node test-zalopay-v2.js
```

### 2. **Test thủ công**
```bash
# Start backend
npm run server

# Start frontend
npm run dev

# Test qua giao diện
# 1. Truy cập checkout page
# 2. Chọn "Thanh toán bằng ZaloPay"
# 3. Điền thông tin và test
```

### 3. **Test với ngrok**
```bash
# Expose backend
ngrok http 4000

# Cập nhật callback URL trong ZaloPay Developer Portal
# https://abc123.ngrok.io/api/payment/zalopay/callback
```

## 🔍 Debug và Troubleshooting

### 1. **Logs quan trọng**
```javascript
// Backend logs
console.log('ZaloPay v2 create order data:', data);
console.log('ZaloPay v2 API response:', response.data);
console.log('ZaloPay v2 order created successfully:', {...});
console.error('ZaloPay v2 API error:', {...});
```

### 2. **Lỗi thường gặp**

**sub_return_code: -401 (Dữ liệu yêu cầu không hợp lệ)**
- Kiểm tra MAC generation
- Kiểm tra app_trans_id format
- Kiểm tra embed_data JSON format

**sub_return_code: -402 (Chữ ký không hợp lệ)**
- Kiểm tra key1 trong .env
- Kiểm tra thứ tự MAC parameters
- Kiểm tra encoding của raw data

**sub_return_code: -403 (App ID không tồn tại)**
- Kiểm tra ZALOPAY_APP_ID trong .env
- Kiểm tra sandbox credentials

### 3. **Kiểm tra database**
```sql
SELECT id, paymentMethod, paymentStatus, status, transactionId, ghnOrderCode 
FROM "Order" 
WHERE paymentMethod = 'ZALOPAY';
```

## 📊 API Endpoints

### 1. **Tạo đơn ZaloPay**
```http
POST /api/payment/zalopay/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_123",
  "amount": 100000,
  "description": "Thanh toán đơn hàng",
  "returnUrl": "https://domain.com/payment/success"
}
```

### 2. **Kiểm tra trạng thái**
```http
GET /api/payment/zalopay/status/:orderId
Authorization: Bearer <token>
```

### 3. **Callback endpoint**
```http
POST /api/payment/zalopay/callback
Content-Type: application/x-www-form-urlencoded

{
  "data": "...",
  "mac": "...",
  "type": "payment",
  "code": 1,
  "message": "success"
}
```

## 🔒 Bảo mật

- ✅ **MAC verification** cho tất cả requests
- ✅ **HTTPS callback URL** bắt buộc
- ✅ **Environment variables** cho secrets
- ✅ **Input validation** đầy đủ
- ✅ **Error handling** không leak thông tin

## 📈 Production Deployment

### 1. **Cấu hình Production**
```env
# Production ZaloPay credentials
ZALOPAY_APP_ID="your_production_app_id"
ZALOPAY_KEY1="your_production_key1"
ZALOPAY_KEY2="your_production_key2"
ZALOPAY_CREATE_ENDPOINT="https://openapi.zalopay.vn/v2/create"
ZALOPAY_SANDBOX_CALLBACK_URL="https://yourdomain.com/api/payment/zalopay/callback"
```

### 2. **SSL Certificate**
- Đảm bảo HTTPS cho callback URL
- Cập nhật callback URL trong ZaloPay Production Portal

### 3. **Monitoring**
- Monitor callback success rate
- Log tất cả ZaloPay API calls
- Alert khi có lỗi thanh toán

---

**🎉 ZaloPay Gateway v2 đã sẵn sàng cho production!**
