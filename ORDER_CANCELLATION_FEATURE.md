# Tính năng hủy đơn hàng GHN

## Tổng quan

Tính năng hủy đơn hàng cho phép admin và người dùng hủy các đơn hàng đã được tạo trên hệ thống và đồng bộ với GHN (Giao Hàng Nhanh).

## API Endpoints

### 1. Admin Cancel Order
```
POST /api/admin/orders/:id/cancel
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đơn hàng đã được hủy thành công",
  "order": { ... },
  "ghnResult": { ... }
}
```

### 2. User Cancel Order
```
POST /api/users/orders/:orderId/cancel
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đơn hàng đã được hủy thành công",
  "order": { ... },
  "ghnResult": { ... }
}
```

## Quy tắc hủy đơn hàng

### Admin
- Có thể hủy đơn hàng ở trạng thái: `PENDING`, `PROCESSING`
- Không thể hủy đơn hàng đã: `COMPLETED`, `SHIPPING`, `CANCELLED`

### Người dùng
- Chỉ có thể hủy đơn hàng trong vòng 24 giờ đầu
- Chỉ có thể hủy đơn hàng ở trạng thái: `PENDING`, `PROCESSING`
- Không thể hủy đơn hàng đã: `COMPLETED`, `SHIPPING`, `CANCELLED`

## Tích hợp GHN API

### Endpoint GHN
```
POST https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/cancel
```

**Headers:**
```
Content-Type: application/json
Token: <ghn-token>
ShopId: <ghn-shop-id>
```

**Body:**
```json
{
  "order_codes": ["GHN_ORDER_CODE"]
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "order_code": "GHN_ORDER_CODE",
      "result": true,
      "message": "OK"
    }
  ]
}
```

## Giao diện người dùng

### Admin Dashboard
- Nút hủy đơn hàng (X) xuất hiện trong cột "Thao tác" cho đơn hàng có thể hủy
- Nút hủy đơn hàng trong modal chi tiết đơn hàng
- Xác nhận trước khi hủy đơn hàng

### Trang Profile người dùng
- Nút "Hủy đơn hàng" trong danh sách đơn hàng cho đơn hàng có thể hủy
- Nút "Hủy đơn hàng" trong modal chi tiết đơn hàng
- Xác nhận trước khi hủy đơn hàng

## Xử lý lỗi

### Lỗi thường gặp
1. **Đơn hàng không tồn tại**: `404 - Đơn hàng không tồn tại`
2. **Đơn hàng đã hủy**: `400 - Đơn hàng đã được hủy trước đó`
3. **Không thể hủy đơn hàng đã hoàn thành**: `400 - Không thể hủy đơn hàng đã hoàn thành`
4. **Không thể hủy đơn hàng đang vận chuyển**: `400 - Không thể hủy đơn hàng đang vận chuyển`
5. **Quá thời gian hủy**: `400 - Chỉ có thể hủy đơn hàng trong vòng 24 giờ đầu`

### Xử lý lỗi GHN API
- Nếu GHN API lỗi, hệ thống vẫn tiếp tục hủy đơn hàng trong database
- Log lỗi GHN để debug
- Thông báo cho người dùng về kết quả hủy đơn hàng

## Database Schema

### Order Model
```prisma
model Order {
  id            String        @id @default(cuid())
  userId        String
  totalPrice    Float
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  ghnOrderCode  String?       // Mã đơn hàng GHN
  // ... other fields
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPING
  COMPLETED
  CANCELLED
}
```

## Testing

Sử dụng file `test-cancel-order.js` để test các API endpoints:

```bash
# Cập nhật các biến trong file test
# ORDER_ID, ADMIN_TOKEN, USER_TOKEN, GHN_ORDER_CODE

# Chạy test
node test-cancel-order.js
```

## Cấu hình môi trường

### Backend (.env)
```
GHN_BASE_URL=https://dev-online-gateway.ghn.vn
GHN_TOKEN=your-ghn-token
GHN_SHOP_ID=your-shop-id
```

### Frontend
- API base URL: `http://localhost:4000/api` (development)
- Các endpoint được định nghĩa trong `src/lib/api.ts`

## Bảo mật

1. **Authentication**: Tất cả endpoints yêu cầu JWT token
2. **Authorization**: 
   - Admin endpoints yêu cầu role ADMIN
   - User endpoints chỉ cho phép hủy đơn hàng của chính họ
3. **Validation**: Kiểm tra trạng thái đơn hàng trước khi hủy
4. **Rate Limiting**: Có thể thêm rate limiting cho API hủy đơn hàng

## Monitoring và Logging

- Log tất cả các thao tác hủy đơn hàng
- Log kết quả từ GHN API
- Monitor tỷ lệ hủy đơn hàng
- Alert khi có lỗi GHN API

## Tương lai

### Tính năng có thể mở rộng
1. **Hoàn tiền tự động**: Tích hợp với PayPal để hoàn tiền tự động
2. **Thông báo**: Gửi email/SMS thông báo hủy đơn hàng
3. **Lịch sử hủy**: Lưu lý do hủy đơn hàng
4. **Batch cancellation**: Hủy nhiều đơn hàng cùng lúc
5. **Scheduled cancellation**: Hủy đơn hàng theo lịch trình
