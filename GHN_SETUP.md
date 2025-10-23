# Hướng dẫn cấu hình GHN (Giao Hàng Nhanh)

## 1. Đăng ký tài khoản GHN

1. Truy cập [https://dev.ghn.vn/](https://dev.ghn.vn/)
2. Đăng ký tài khoản doanh nghiệp
3. Xác thực tài khoản và cung cấp thông tin cửa hàng

## 2. Lấy thông tin API

Sau khi đăng ký thành công, bạn sẽ nhận được:
- **Token API**: Mã xác thực API
- **Shop ID**: ID cửa hàng

## 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tpestore"

# JWT Secret
JWT_SECRET="your-jwt-secret-key"

# GHN (Giao Hàng Nhanh) Configuration
GHN_BASE_URL="https://dev-online-gateway.ghn.vn"
GHN_TOKEN="your-ghn-token"
GHN_SHOP_ID="your-shop-id"

# GHN Return Address (Địa chỉ trả hàng)
GHN_RETURN_NAME="TPE Store"
GHN_RETURN_PHONE="0123456789"
GHN_RETURN_ADDRESS="123 Đường ABC, Quận 1"
GHN_RETURN_WARD_CODE="your-ward-code"
GHN_RETURN_DISTRICT_ID="your-district-id"
GHN_RETURN_PROVINCE_ID="your-province-id"

# PayPal Configuration
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox" # sandbox or live
```

## 4. Lấy ID địa chỉ

### Lấy Province ID:
```bash
curl -X GET "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province" \
  -H "Token: YOUR_TOKEN" \
  -H "ShopId: YOUR_SHOP_ID"
```

### Lấy District ID:
```bash
curl -X GET "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=PROVINCE_ID" \
  -H "Token: YOUR_TOKEN" \
  -H "ShopId: YOUR_SHOP_ID"
```

### Lấy Ward ID:
```bash
curl -X GET "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=DISTRICT_ID" \
  -H "Token: YOUR_TOKEN" \
  -H "ShopId: YOUR_SHOP_ID"
```

## 5. API Endpoints

Sau khi cấu hình xong, các API endpoints sau sẽ hoạt động:

- `GET /api/shipping/provinces` - Lấy danh sách tỉnh/thành phố
- `GET /api/shipping/districts/:provinceId` - Lấy danh sách quận/huyện
- `GET /api/shipping/wards/:districtId` - Lấy danh sách phường/xã
- `GET /api/shipping/services` - Lấy danh sách dịch vụ vận chuyển
- `POST /api/shipping/calculate-fee` - Tính phí vận chuyển
- `POST /api/shipping/create-order` - Tạo đơn hàng vận chuyển
- `GET /api/shipping/track/:orderCode` - Theo dõi đơn hàng
- `POST /api/shipping/cancel/:orderCode` - Hủy đơn hàng

## 6. Test API

Bạn có thể test API bằng cách:

1. Khởi động server: `npm run dev`
2. Test tạo đơn hàng:
```bash
curl -X POST "http://localhost:4000/api/shipping/create-order" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-001",
    "products": [
      {
        "name": "Laptop Dell",
        "weight": 2.5,
        "quantity": 1,
        "product_code": "LAPTOP001"
      }
    ],
    "name": "Nguyễn Văn A",
    "tel": "0912345678",
    "address": "123 Nguyễn Huệ",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "hamlet": "Khác",
    "value": 15000000,
    "pickMoney": 15000000,
    "transport": "road",
    "pickOption": "cod",
    "isFreeship": "0",
    "note": "Đơn hàng test từ TPE Store"
  }'
```

3. Test tính phí vận chuyển:
```bash
curl -X POST "http://localhost:4000/api/shipping/calculate-fee" \
  -H "Content-Type: application/json" \
  -d '{
    "pickProvince": "TP. Hồ Chí Minh",
    "pickDistrict": "Quận 3",
    "pickWard": "Phường 1",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "weight": 2.5,
    "value": 15000000
  }'
```

## 7. Bảng mã trạng thái đơn hàng

Theo [tài liệu chính thức của GHTK](https://api.ghtk.vn/docs/submit-order/tracking-status), các trạng thái đơn hàng bao gồm:

| Mã | Trạng thái | Mô tả |
|---|---|---|
| 1 | Chưa tiếp nhận | Đơn hàng chưa được GHTK tiếp nhận |
| 2 | Đã tiếp nhận | Đơn hàng đã được GHTK tiếp nhận |
| 3 | Đã lấy hàng | Đơn hàng đã được lấy từ người gửi |
| 4 | Đã giao hàng | Đơn hàng đã được giao thành công |
| 5 | Đã hủy | Đơn hàng đã bị hủy |
| 6 | Đã trả hàng | Đơn hàng đã được trả về người gửi |

## 8. Format API tạo đơn hàng

Theo mẫu API chính thức của GHTK:

**Endpoint:** `POST /services/shipment/order/?ver=1.5`

**Headers:**
```
Token: {API_TOKEN}
X-Client-Source: {PARTNER_CODE}
Content-Type: application/json
```

**Payload:**
```json
{
  "products": [{
    "name": "Tên sản phẩm",
    "weight": 0.1,
    "quantity": 1,
    "product_code": "Mã sản phẩm"
  }],
  "order": {
    "id": "Mã đơn hàng đối tác",
    "pick_name": "Tên người gửi",
    "pick_address": "Địa chỉ lấy hàng",
    "pick_province": "Tỉnh lấy hàng",
    "pick_district": "Quận lấy hàng",
    "pick_ward": "Phường lấy hàng",
    "pick_tel": "SĐT người gửi",
    "tel": "SĐT người nhận",
    "name": "Tên người nhận",
    "address": "Địa chỉ giao hàng",
    "province": "Tỉnh giao hàng",
    "district": "Quận giao hàng",
    "ward": "Phường giao hàng",
    "hamlet": "Thôn/Ấp",
    "is_freeship": "0",
    "pick_date": "2024-01-01",
    "pick_money": 0,
    "note": "Ghi chú",
    "value": 0,
    "transport": "road",
    "pick_option": "cod"
  }
}
```

## 9. Lưu ý quan trọng

- API sử dụng endpoint `/services/shipment/order/?ver=1.5` với version 1.5
- Trọng lượng tính bằng **kg** (không phải gram)
- `is_freeship`: "0" (có phí) hoặc "1" (miễn phí)
- `pick_option`: "cod" (thu hộ) hoặc "prepaid" (trả trước)
- `transport`: "road" (đường bộ) hoặc "fly" (hàng không)
- `pick_date`: Format YYYY-MM-DD
- API tracking sử dụng endpoint `/services/shipment/v2/{TRACKING_ORDER}` với headers `Token` và `X-Client-Source`
- Tracking order có thể là mã đơn hàng GHTK hoặc mã đối tác (partner_id)
