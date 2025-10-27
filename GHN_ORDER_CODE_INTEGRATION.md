# GHN Order Code Integration

## Tổng quan
Tính năng này tích hợp hiển thị mã đơn hàng GHN (Giao Hàng Nhanh) vào hệ thống quản lý đơn hàng, cho phép admin và người dùng xem mã đơn GHN và chi tiết vận chuyển.

## Các thay đổi đã thực hiện

### 1. Database Schema
- Thêm trường `ghnOrderCode` vào model `Order` trong Prisma schema
- Tạo migration để thêm trường này vào database

### 2. Backend API
- Cập nhật `GHNService` để thêm method `getOrderDetail()` sử dụng API GHN
- Thêm endpoint `/admin/orders/ghn/:orderCode` để lấy chi tiết đơn hàng GHN
- Cập nhật các controller để bao gồm `ghnOrderCode` trong response

### 3. Frontend Admin
- Cập nhật trang quản lý đơn hàng admin để hiển thị mã GHN
- Cập nhật `OrderDetailModal` để hiển thị mã GHN và nút xem chi tiết
- Tạo component `GHNOrderDetail` để hiển thị chi tiết đơn hàng GHN

### 4. Frontend User
- Cập nhật trang profile người dùng để hiển thị mã GHN trong danh sách đơn hàng
- Cập nhật API call để lấy `ghnOrderCode` từ backend

## Cách sử dụng

### Cho Admin
1. Truy cập trang quản lý đơn hàng admin
2. Trong danh sách đơn hàng, mã GHN sẽ hiển thị dưới mã đơn hàng nội bộ
3. Click vào "Xem chi tiết" để mở modal chi tiết đơn hàng
4. Nếu có mã GHN, sẽ có nút "Xem chi tiết GHN" để xem thông tin vận chuyển

### Cho Người dùng
1. Truy cập trang profile cá nhân
2. Chuyển sang tab "Lịch sử đơn hàng"
3. Mã GHN sẽ hiển thị dưới thông tin đơn hàng nếu có

## API Endpoints

### Lấy chi tiết đơn hàng GHN
```
GET /api/admin/orders/ghn/:orderCode
```

**Headers:**
- `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "order_code": "5ENLKKHD",
    "status": "delivered",
    "to_name": "Nguyễn Văn A",
    "to_phone": "0123456789",
    "to_address": "123 Đường ABC, Quận 1, TP.HCM",
    // ... other GHN order details
  }
}
```

## Cấu hình GHN API

Đảm bảo các biến môi trường sau được cấu hình:

```env
GHN_BASE_URL=https://dev-online-gateway.ghn.vn
GHN_TOKEN=your_ghn_token
GHN_SHOP_ID=your_shop_id
```

## Testing

Sử dụng script test để kiểm tra API:
```bash
node test-ghn-order-detail.js
```

## Lưu ý
- Mã GHN chỉ hiển thị khi đơn hàng đã được tạo trên hệ thống GHN
- Cần có token admin hợp lệ để truy cập API chi tiết GHN
- API GHN có thể có giới hạn rate limit, cần xử lý error appropriately
