# GHN API Configuration Fix

## 🚨 Vấn đề hiện tại:
- GHN orders được tạo thành công (có GHN codes: L4GQQQ, L47EEE, L47EEM, L47EER, L47EE8)
- GHN API trả về "Token is not valid!" 
- Frontend không thể fetch status thực tế → hiển thị "chờ lấy hàng"

## 🔧 Giải pháp:

### 1. Cập nhật GHN Credentials trong .env:
```bash
# Thay thế bằng credentials thực tế từ GHN Merchant Portal
GHN_BASE_URL=https://online-gateway.ghn.vn
GHN_TOKEN=your_actual_ghn_token
GHN_SHOP_ID=your_actual_shop_id
```

### 2. Hoặc sử dụng Sandbox credentials mới:
```bash
GHN_BASE_URL=https://dev-online-gateway.ghn.vn
GHN_TOKEN=new_sandbox_token
GHN_SHOP_ID=new_sandbox_shop_id
```

### 3. Test lại sau khi cập nhật:
```bash
node test-ghn-environment.js
```

## 📋 Hướng dẫn lấy GHN Credentials:

1. **Đăng nhập GHN Merchant Portal**: https://merchant.ghn.vn/
2. **Vào Settings → API**: Lấy Token và Shop ID
3. **Cập nhật .env file** với credentials mới
4. **Restart server** để load environment variables mới

## 🎯 Kết quả mong đợi:
- GHN API sẽ trả về status thực tế: "ready_to_pick", "picking", "delivering", etc.
- Frontend sẽ hiển thị đúng trạng thái GHN thay vì "chờ lấy hàng"
- Order tracking sẽ hoạt động chính xác

## ⚠️ Lưu ý:
- Nếu đơn hàng được tạo trong Production → dùng Production credentials
- Nếu đơn hàng được tạo trong Sandbox → dùng Sandbox credentials
- Có thể cần tạo đơn hàng mới với credentials đúng
