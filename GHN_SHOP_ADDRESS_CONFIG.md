# 🔧 Cấu Hình Địa Chỉ Shop (GHN Shipping)

## ❌ Vấn Đề

Lỗi khi tạo đơn hàng vận chuyển:
```
Address convert from fail: callGoogleAPI: invalid google status [REQUEST_DENIED]
address: [650 Lê Hồng Phong, Phú Hoà, Thủ Dầu Một, Bình Dương, Việt Nam, Phường Cống Vị, Quận Ba Đình, Hà Nội]
```

**Nguyên nhân:** Địa chỉ shop (nơi gửi hàng) đang bị hardcode là "Phường Cống Vị, Quận Ba Đình, Hà Nội" và không khớp với địa chỉ thực tế của shop.

---

## ✅ Giải Pháp

### Bước 1: Tìm Mã Địa Chỉ Shop

Bạn cần tìm:
- **District ID** (Mã quận/huyện) của shop
- **Ward Code** (Mã phường/xã) của shop

**Cách tìm:**

1. **Lấy danh sách tỉnh/thành:**
   ```
   GET http://localhost:4000/api/v1/shipping/provinces
   ```
   Tìm `ProvinceID` của tỉnh/thành nơi shop đặt

2. **Lấy danh sách quận/huyện:**
   ```
   GET http://localhost:4000/api/v1/shipping/districts/{ProvinceID}
   ```
   Tìm `DistrictID` của quận/huyện nơi shop đặt

3. **Lấy danh sách phường/xã:**
   ```
   GET http://localhost:4000/api/v1/shipping/wards/{DistrictID}
   ```
   Tìm `WardCode` của phường/xã nơi shop đặt

**Ví dụ:**
- Shop ở: **650 Lê Hồng Phong, Phú Hoà, Thủ Dầu Một, Bình Dương**
- Tỉnh: Bình Dương → `ProvinceID: 253`
- Quận/Huyện: Thủ Dầu Một → `DistrictID: 1723`
- Phường/Xã: Phú Hoà → `WardCode: 600701`

---

### Bước 2: Cấu Hình Environment Variables

Thêm vào file `.env` của backend:

```env
# Địa chỉ Shop (nơi gửi hàng)
GHN_SHOP_WARD_CODE=600701
GHN_SHOP_DISTRICT_ID=1723
GHN_SHOP_PROVINCE_ID=253
GHN_SHOP_ADDRESS=650 Lê Hồng Phong, Phú Hoà, Thủ Dầu Một, Bình Dương
```

**Lưu ý:**
- `GHN_SHOP_WARD_CODE`: Mã phường/xã (string)
- `GHN_SHOP_DISTRICT_ID`: Mã quận/huyện (số)
- `GHN_SHOP_PROVINCE_ID`: Mã tỉnh/thành (số, tùy chọn)
- `GHN_SHOP_ADDRESS`: Địa chỉ đầy đủ (string, để log/debug)

---

### Bước 3: Restart Backend Server

Sau khi cập nhật `.env`, restart server:

```bash
npm run server
```

---

## 🔍 Kiểm Tra

Sau khi restart, khi tạo đơn hàng, check log trong console:

```
[GHN][CreateOrder] Shop address - District: 1723 Ward: 600701
```

Nếu thấy đúng địa chỉ shop của bạn thì đã cấu hình thành công!

---

## 📝 Default Values

Nếu không set environment variables, hệ thống sẽ dùng giá trị mặc định:

- `GHN_SHOP_WARD_CODE`: `"1A0101"` (Phường Cống Vị, Hà Nội)
- `GHN_SHOP_DISTRICT_ID`: `1442` (Quận Ba Đình, Hà Nội)

**⚠️ Cảnh báo:** Nếu shop không ở Hà Nội, bạn **PHẢI** cấu hình đúng địa chỉ, nếu không sẽ gặp lỗi khi tạo đơn vận chuyển!

---

## 🐛 Troubleshooting

### Lỗi vẫn còn sau khi cấu hình

1. **Kiểm tra file `.env`:**
   - Đảm bảo không có khoảng trắng thừa
   - Đảm bảo giá trị đúng format (số cho ID, string cho code)

2. **Kiểm tra server đã restart chưa:**
   - Environment variables chỉ load khi server khởi động
   - Phải restart server sau khi sửa `.env`

3. **Kiểm tra log:**
   - Xem log `[GHN][CreateOrder] Shop address` có đúng không
   - Nếu vẫn thấy giá trị cũ, có thể cache hoặc chưa restart

### Lỗi Google API Key

Nếu vẫn gặp lỗi `REQUEST_DENIED` từ Google API:
- Đây là lỗi từ phía GHN API (họ dùng Google API để convert địa chỉ)
- Có thể do GHN chưa config Google API key đúng
- Hoặc IP server của bạn chưa được whitelist trong Google API key của GHN
- **Giải pháp:** Liên hệ GHN support hoặc thử lại sau

---

## 📚 Tham Khảo

- File config: `backend/src/config/ghn.js`
- Service: `backend/src/services/ghn.service.js`
- API GHN: https://dev-online-gateway.ghn.vn

