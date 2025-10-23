# GHN Configuration Guide

## Environment Variables for GHN API

Để sử dụng đầy đủ tính năng GHN API, bạn cần cấu hình các biến môi trường sau:

### ⚠️ **Lưu ý quan trọng:**
Đảm bảo cấu hình đúng thông tin Shop ID và Token từ GHN dashboard.

### Required Variables
```bash
GHN_BASE_URL="https://dev-online-gateway.ghn.vn"
GHN_TOKEN="your-ghn-token"
GHN_SHOP_ID="your-shop-id"
```

### Return Address Configuration
```bash
GHN_RETURN_NAME="TPE Store"
GHN_RETURN_PHONE="0123456789"
GHN_RETURN_ADDRESS="123 Đường ABC, Quận 1"
GHN_RETURN_WARD_CODE="440102"
GHN_RETURN_DISTRICT_ID="1442"
GHN_RETURN_PROVINCE_ID="202"
```

### Service Configuration (for service type 1 - standard delivery)
```bash
GHN_CONFIG_FEE_ID="0"
GHN_EXTRA_COST_ID="0"
```


## Service Types

- **Service Type 2**: Hàng nhẹ (Light goods) - Dưới 10 sản phẩm
- **Service Type 5**: Hàng nặng (Heavy goods) - Từ 10 sản phẩm trở lên

### Logic tự động chọn service type:
- **< 10 sản phẩm**: Tự động chọn Service Type 2 (Hàng nhẹ)
- **≥ 10 sản phẩm**: Tự động chọn Service Type 5 (Hàng nặng)

### Kích thước/khối lượng tự động:
- **Service Type 2**: 20x20x20cm, 200g per item (kích thước tổng thể)
- **Service Type 5**: 15x15x10cm, 200g per item (theo công thức GHN: Max(length), Max(width), Sum(height))

## Tính toán kích thước/khối lượng

### Service Type 2 (Hàng nhẹ):
- Sử dụng kích thước tổng thể của đơn hàng
- Tính cước theo: length, width, height, weight

### Service Type 5 (Hàng nặng):
- Sử dụng kích thước từng item riêng biệt
- GHN tính toán theo công thức:
  - **Kích thước**: Max(length), Max(width), Sum(height)
  - **Khối lượng quy đổi**: (Length × Width × Height) / 5
  - **Khối lượng tính cước**: Max(quy đổi, trọng lượng thực tế)

## Troubleshooting

### Lỗi "ConfigFeeID" và "ExtraCostID"
1. Chỉ xảy ra với service type 1 (không còn sử dụng)
2. Với service type 2 và 5, không cần cấu hình các trường này

### Lỗi "SHOP_NOT_FOUND"
1. Kiểm tra `GHN_SHOP_ID` trong file `.env`
2. Đảm bảo Shop ID tồn tại và hoạt động trong GHN dashboard

### Lỗi "TOKEN_INVALID"
1. Kiểm tra `GHN_TOKEN` trong file `.env`
2. Đảm bảo token còn hiệu lực và có quyền truy cập API

### Lỗi "PHONE_INVALID" hoặc số điện thoại không hợp lệ
1. Sử dụng số điện thoại Việt Nam chuẩn (10-11 số)
2. Ví dụ số điện thoại hợp lệ: `0376560307`
3. Không sử dụng số điện thoại giả hoặc không tồn tại

### Lỗi chung khi tạo đơn hàng:
1. Kiểm tra số lượng sản phẩm (tự động chọn service type)
2. Đảm bảo kích thước/khối lượng hợp lệ
3. Kiểm tra cấu hình GHN API credentials
4. Sử dụng số điện thoại thật và hợp lệ
