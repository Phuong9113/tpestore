# Hướng Dẫn Test Tạo Đơn Hàng Bằng Postman

## Tổng Quan

API tạo đơn hàng yêu cầu:
- **Authentication**: Bearer Token (JWT)
- **Method**: POST
- **Endpoint**: `/api/v1/orders`
- **Content-Type**: `application/json`

---

## Bước 1: Đăng Nhập Để Lấy Token

### Request 1: Đăng Nhập

**Method:** `POST`  
**URL:** `http://localhost:4000/api/v1/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response mẫu:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

**Lưu ý:** Copy token từ response để sử dụng ở bước tiếp theo.

---

## Bước 2: Lấy Danh Sách Sản Phẩm (Để Lấy Product ID)

### Request 2: Lấy Danh Sách Sản Phẩm

**Method:** `GET`  
**URL:** `http://localhost:4000/api/v1/products`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response mẫu:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "Laptop",
      "price": 15000000,
      "stock": 10,
      "image": "/uploads/product.jpg"
    },
    ...
  ]
}
```

**Lưu ý:** Ghi lại `id` của các sản phẩm bạn muốn thêm vào đơn hàng.

---

## Bước 3: Tạo Đơn Hàng

### Request 3: Tạo Đơn Hàng

**Method:** `POST`  
**URL:** `http://localhost:4000/api/v1/orders`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON) - Đơn Hàng COD:**
```json
{
  "items": [
    {
      "productId": "clxxx...",
      "quantity": 2,
      "price": 15000000
    },
    {
      "productId": "clyyy...",
      "quantity": 1,
      "price": 5000000
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
    "provinceName": "Hồ Chí Minh",
    "districtName": "Quận 1",
    "wardName": "Phường Bến Nghé",
    "shippingFee": 30000
  }
}
```

**Body (raw JSON) - Đơn Hàng ZaloPay:**
```json
{
  "items": [
    {
      "productId": "clxxx...",
      "quantity": 1,
      "price": 15000000
    }
  ],
  "paymentMethod": "ZALOPAY",
  "shippingInfo": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "province": "79",
    "provinceName": "Hồ Chí Minh",
    "district": "760",
    "districtName": "Quận 1",
    "ward": "26734",
    "wardName": "Phường Bến Nghé",
    "shippingFee": 30000
  }
}
```

### Giải Thích Các Trường:

#### `items` (Bắt buộc)
- Mảng các sản phẩm trong đơn hàng
- Mỗi item cần có:
  - `productId`: ID của sản phẩm (bắt buộc)
  - `quantity`: Số lượng (bắt buộc, phải > 0)
  - `price`: Giá của sản phẩm (bắt buộc)

#### `paymentMethod` (Tùy chọn, mặc định: "COD")
- `"COD"`: Thanh toán khi nhận hàng
- `"ZALOPAY"`: Thanh toán qua ZaloPay

#### `shippingInfo` (Tùy chọn)
- `name`: Tên người nhận
- `phone`: Số điện thoại
- `address`: Địa chỉ chi tiết
- `province`: Mã tỉnh/thành phố (GHN)
- `district`: Mã quận/huyện (GHN)
- `ward`: Mã phường/xã (GHN)
- `provinceName`: Tên tỉnh/thành phố
- `districtName`: Tên quận/huyện
- `wardName`: Tên phường/xã
- `shippingFee`: Phí vận chuyển (mặc định: 0)

### Response Thành Công (201 Created):

```json
{
  "success": true,
  "message": "Created",
  "data": {
    "id": "clzzz...",
    "userId": "clxxx...",
    "totalPrice": 35030000,
    "status": "PROCESSING",
    "paymentStatus": "PAID",
    "paymentMethod": "COD",
    "shippingName": "Nguyễn Văn A",
    "shippingPhone": "0123456789",
    "shippingAddress": "123 Đường ABC",
    "shippingProvince": "79",
    "shippingDistrict": "760",
    "shippingWard": "26734",
    "shippingFee": 30000,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "orderItems": [
      {
        "id": "claaa...",
        "productId": "clxxx...",
        "quantity": 2,
        "price": 15000000,
        "product": {
          "id": "clxxx...",
          "name": "Laptop",
          "image": "/uploads/product.jpg",
          "price": 15000000
        }
      },
      {
        "id": "clbbb...",
        "productId": "clyyy...",
        "quantity": 1,
        "price": 5000000,
        "product": {
          "id": "clyyy...",
          "name": "Smartphone",
          "image": "/uploads/product2.jpg",
          "price": 5000000
        }
      }
    ]
  }
}
```

### Response Lỗi:

**400 Bad Request - Thiếu items:**
```json
{
  "error": "Validation error",
  "message": "items is required"
}
```

**400 Bad Request - Product không tồn tại:**
```json
{
  "error": "Products not found: clxxx..."
}
```

**400 Bad Request - Payment method không hợp lệ:**
```json
{
  "error": "Invalid payment method"
}
```

**401 Unauthorized - Thiếu hoặc token không hợp lệ:**
```json
{
  "error": "Unauthorized"
}
```

---

## Bước 4: Xác Minh Đơn Hàng Đã Tạo

### Request 4: Lấy Danh Sách Đơn Hàng

**Method:** `GET`  
**URL:** `http://localhost:4000/api/v1/orders`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Request 5: Lấy Chi Tiết Đơn Hàng

**Method:** `GET`  
**URL:** `http://localhost:4000/api/v1/orders/{orderId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Cấu Hình Postman Collection

### Tạo Environment Variables:

1. Tạo Environment mới trong Postman
2. Thêm các biến:
   - `base_url`: `http://localhost:4000`
   - `token`: (sẽ được set tự động sau khi login)

### Tạo Pre-request Script cho Login:

Trong request Login, thêm vào tab **Tests**:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
    }
}
```

### Sử Dụng Token Tự Động:

Trong các request cần authentication, thêm vào **Authorization** tab:
- Type: `Bearer Token`
- Token: `{{token}}`

---

## Ví Dụ Request Body Đầy Đủ

### Đơn Hàng Đơn Giản (COD):
```json
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
    "name": "Trần Văn B",
    "phone": "0987654321",
    "address": "456 Đường XYZ, Phường ABC",
    "province": "79",
    "district": "760",
    "ward": "26734",
    "provinceName": "Hồ Chí Minh",
    "districtName": "Quận 1",
    "wardName": "Phường Bến Nghé",
    "shippingFee": 25000
  }
}
```

### Đơn Hàng Nhiều Sản Phẩm (ZaloPay):
```json
{
  "items": [
    {
      "productId": "clxxx123",
      "quantity": 2,
      "price": 15000000
    },
    {
      "productId": "clyyy456",
      "quantity": 3,
      "price": 5000000
    },
    {
      "productId": "clzzz789",
      "quantity": 1,
      "price": 8000000
    }
  ],
  "paymentMethod": "ZALOPAY",
  "shippingInfo": {
    "name": "Lê Thị C",
    "phone": "0912345678",
    "address": "789 Đường DEF",
    "province": "79",
    "provinceName": "Hồ Chí Minh",
    "district": "761",
    "districtName": "Quận 2",
    "ward": "26740",
    "wardName": "Phường Thảo Điền",
    "shippingFee": 35000
  }
}
```

---

## Lưu Ý Quan Trọng

1. **Token JWT**: Token có thời hạn, nếu hết hạn cần đăng nhập lại
2. **Product ID**: Phải là ID hợp lệ từ database
3. **Price**: Giá phải khớp với giá sản phẩm hiện tại
4. **Quantity**: Phải là số nguyên dương
5. **Shipping Fee**: Tự động tính hoặc có thể set thủ công
6. **Cart Clear**: Sau khi tạo đơn hàng thành công, giỏ hàng sẽ tự động được xóa

---

## Troubleshooting

### Lỗi 401 Unauthorized - HƯỚNG DẪN CHI TIẾT

Lỗi `{"error": "Unauthorized"}` xảy ra khi API không nhận được token hợp lệ. Hãy làm theo các bước sau:

#### Bước 1: Kiểm tra bạn đã đăng nhập chưa

1. **Chạy request Login trước:**
   - Method: `POST`
   - URL: `http://localhost:4000/api/v1/auth/login`
   - Body:
   ```json
   {
     "email": "your_email@example.com",
     "password": "your_password"
   }
   ```

2. **Kiểm tra response có token không:**
   - Response phải có dạng:
   ```json
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {...}
     }
   }
   ```
   - Nếu không có token, kiểm tra email/password có đúng không

#### Bước 2: Kiểm tra Header Authorization trong Postman

**Cách 1: Sử dụng Authorization Tab (Khuyến nghị)**

1. Mở request "Create Order" trong Postman
2. Vào tab **Authorization**
3. Chọn Type: **Bearer Token**
4. Trong ô Token, nhập: `{{token}}` (nếu dùng environment) hoặc paste token trực tiếp
5. **QUAN TRỌNG:** Đảm bảo không có khoảng trắng thừa trước/sau token

**Cách 2: Thêm Header thủ công**

1. Vào tab **Headers**
2. Thêm header mới:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`
   - **LƯU Ý:** Phải có chữ "Bearer" + một khoảng trắng + token (không có dấu ngoặc kép)

**Ví dụ đúng:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNs...
```

**Ví dụ sai:**
```
Authorization: Bearer  eyJhbG... (2 khoảng trắng)
Authorization: eyJhbG... (thiếu "Bearer ")
Authorization: "Bearer eyJhbG..." (có dấu ngoặc kép)
```

#### Bước 3: Kiểm tra Environment Variables (nếu dùng)

1. Click vào icon **Environment** ở góc trên bên phải Postman
2. Chọn environment "TPE Store - Local" (hoặc environment bạn đang dùng)
3. Kiểm tra biến `token` có giá trị không
4. Nếu `token` rỗng:
   - Chạy lại request Login
   - Kiểm tra script trong tab **Tests** của request Login có chạy không
   - Script phải có:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       if (jsonData.data && jsonData.data.token) {
           pm.environment.set("token", jsonData.data.token);
       }
   }
   ```

#### Bước 4: Kiểm tra Token có hợp lệ không

1. **Test token bằng request "Get Me":**
   - Method: `GET`
   - URL: `http://localhost:4000/api/v1/auth/me`
   - Header: `Authorization: Bearer YOUR_TOKEN`
   - Nếu trả về 401, token không hợp lệ hoặc đã hết hạn

2. **Nếu token hết hạn:**
   - Đăng nhập lại để lấy token mới
   - Token JWT thường có thời hạn (check trong code backend)

#### Bước 5: Kiểm tra Server có chạy không

1. Đảm bảo backend server đang chạy trên port 4000
2. Test bằng cách gọi endpoint không cần auth:
   - `GET http://localhost:4000/api/v1/products` (nếu không cần auth)
   - Hoặc `POST http://localhost:4000/api/v1/auth/login`

#### Checklist Debug:

- [ ] Đã chạy request Login và nhận được token
- [ ] Token được lưu vào environment variable (nếu dùng)
- [ ] Header Authorization có format đúng: `Bearer {token}`
- [ ] Không có khoảng trắng thừa trong header
- [ ] Token chưa hết hạn (test bằng request Get Me)
- [ ] Backend server đang chạy
- [ ] URL endpoint đúng: `http://localhost:4000/api/v1/orders`

#### Ví dụ Request Headers đúng trong Postman:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsYWJjZGVmZ2giLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk5OTk5OTl9.xyz123
Content-Type: application/json
```

#### Debug bằng Console:

Thêm vào tab **Pre-request Script** của request Create Order:
```javascript
console.log("Token:", pm.environment.get("token"));
console.log("Base URL:", pm.environment.get("base_url"));
```

Xem console ở góc dưới Postman để kiểm tra giá trị.

### Lỗi 400 Validation Error
- Kiểm tra `items` có phải là array không
- Mỗi item phải có đủ `productId`, `quantity`, `price`
- `quantity` phải > 0

### Lỗi Products Not Found
- Kiểm tra `productId` có tồn tại trong database
- Có thể sản phẩm đã bị xóa

### Lỗi Invalid Payment Method
- Chỉ chấp nhận: `"COD"` hoặc `"ZALOPAY"`
- Phân biệt chữ hoa/thường

---

## Checklist Test

- [ ] Đăng nhập thành công và lấy được token
- [ ] Lấy danh sách sản phẩm thành công
- [ ] Tạo đơn hàng COD thành công
- [ ] Tạo đơn hàng ZaloPay thành công
- [ ] Kiểm tra response có đầy đủ thông tin
- [ ] Kiểm tra giỏ hàng đã được xóa sau khi tạo đơn
- [ ] Test với các trường hợp lỗi (thiếu field, product không tồn tại, etc.)

