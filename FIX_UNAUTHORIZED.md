# 🔧 Fix Lỗi "Unauthorized" - Hướng Dẫn Nhanh

## ❌ Lỗi bạn gặp:
```json
{
    "error": "Unauthorized"
}
```

## ✅ Giải Pháp Nhanh (3 Bước)

### Bước 1: Đăng nhập để lấy Token

**Request:**
```
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json

{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Response thành công sẽ có:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

👉 **Copy token từ response**

---

### Bước 2: Thêm Token vào Request Create Order

**Cách 1: Dùng Authorization Tab (Dễ nhất)**

1. Mở request "Create Order" trong Postman
2. Click tab **Authorization**
3. Chọn **Type: Bearer Token**
4. Paste token vào ô **Token**
5. **QUAN TRỌNG:** Không có khoảng trắng thừa

**Cách 2: Thêm Header thủ công**

1. Click tab **Headers**
2. Thêm header:
   - **Key:** `Authorization`
   - **Value:** `Bearer YOUR_TOKEN_HERE`
   - ⚠️ Phải có chữ "Bearer" + 1 khoảng trắng + token

**Ví dụ đúng:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6...
```

**Ví dụ sai:**
```
Authorization: Bearer  eyJhbG... (2 khoảng trắng - SAI)
Authorization: eyJhbG... (thiếu "Bearer " - SAI)
```

---

### Bước 3: Gửi Request

**Request:**
```
POST http://localhost:4000/api/v1/orders
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "items": [
    {
      "productId": "clxxx123",
      "quantity": 1,
      "price": 10000000
    }
  ],
  "paymentMethod": "COD",
  "shippingInfo": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "province": "79",
    "district": "760",
    "ward": "26734",
    "shippingFee": 30000
  }
}
```

---

## 🔍 Kiểm Tra Nhanh

### ✅ Checklist:

- [ ] Đã chạy request Login và có token trong response
- [ ] Header `Authorization` có format: `Bearer {token}`
- [ ] Không có khoảng trắng thừa
- [ ] Backend server đang chạy (port 4000)
- [ ] Token chưa hết hạn

### 🧪 Test Token:

Chạy request này để test token có hợp lệ không:

```
GET http://localhost:4000/api/v1/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

- ✅ Nếu trả về 200: Token hợp lệ
- ❌ Nếu trả về 401: Token không hợp lệ hoặc đã hết hạn → Đăng nhập lại

---

## 🎯 Sử Dụng Postman Environment (Tự Động)

### Setup:

1. **Import Environment:**
   - File → Import → Chọn `TPE_Store_Environment.postman_environment.json`

2. **Thêm Script vào Request Login:**
   - Mở request Login
   - Tab **Tests**
   - Thêm code:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       if (jsonData.data && jsonData.data.token) {
           pm.environment.set("token", jsonData.data.token);
       }
   }
   ```

3. **Dùng Token tự động:**
   - Trong request Create Order
   - Tab **Authorization**
   - Type: **Bearer Token**
   - Token: `{{token}}`

👉 Token sẽ tự động được lấy từ environment sau khi login!

---

## 🚨 Các Lỗi Thường Gặp

### 1. "Unauthorized" ngay sau khi login
- ❌ Chưa copy token vào request
- ✅ Copy token từ response Login

### 2. "Unauthorized" dù đã có token
- ❌ Format header sai
- ✅ Kiểm tra: `Bearer {token}` (có khoảng trắng, không có dấu ngoặc)

### 3. "Invalid token"
- ❌ Token đã hết hạn
- ✅ Đăng nhập lại để lấy token mới

### 4. Không có response từ server
- ❌ Backend chưa chạy
- ✅ Kiểm tra server đang chạy trên port 4000

---

## 📞 Vẫn Không Được?

1. Kiểm tra console của backend server xem có log gì không
2. Kiểm tra file `.env` có `JWT_SECRET` không
3. Xem chi tiết trong file `POSTMAN_GUIDE.md` phần Troubleshooting

