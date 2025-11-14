# Mô Tả Cơ Sở Dữ Liệu - TPE Store

Tài liệu này mô tả chi tiết về cấu trúc các bảng trong cơ sở dữ liệu của hệ thống TPE Store.

## Tổng Quan

Hệ thống sử dụng PostgreSQL làm cơ sở dữ liệu và Prisma ORM để quản lý schema. Cơ sở dữ liệu bao gồm các bảng chính phục vụ cho hệ thống thương mại điện tử.

---

## 1. Bảng User (Người Dùng)

**Mô tả:** Lưu trữ thông tin người dùng của hệ thống, bao gồm khách hàng và quản trị viên.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất của người dùng | Primary Key, CUID |
| `name` | String? | Tên người dùng | Optional |
| `email` | String | Email đăng nhập | Unique, Required |
| `password` | String | Mật khẩu đã được mã hóa | Required |
| `phone` | String? | Số điện thoại | Optional |
| `address` | String? | Địa chỉ | Optional |
| `city` | String? | Thành phố | Optional |
| `birthDate` | DateTime? | Ngày sinh | Optional |
| `gender` | String? | Giới tính | Optional |
| `role` | Role | Vai trò (CUSTOMER/ADMIN) | Default: CUSTOMER |
| `isActive` | Boolean | Trạng thái hoạt động | Default: true |
| `createdAt` | DateTime | Ngày tạo | Auto-generated |
| `updatedAt` | DateTime | Ngày cập nhật | Auto-updated |

### Quan Hệ (Relations)

- `cartItems`: Một người dùng có nhiều mục trong giỏ hàng (CartItem[])
- `orders`: Một người dùng có nhiều đơn hàng (Order[])
- `interactions`: Một người dùng có nhiều tương tác với sản phẩm (ProductInteraction[])
- `reviews`: Một người dùng có nhiều đánh giá (Review[])
- `addresses`: Một người dùng có nhiều địa chỉ (Address[])

---

## 2. Bảng Address (Địa Chỉ)

**Mô tả:** Lưu trữ các địa chỉ giao hàng của người dùng.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất của địa chỉ | Primary Key, CUID |
| `userId` | String | ID người dùng sở hữu địa chỉ | Foreign Key → User.id |
| `name` | String | Tên người nhận | Required |
| `phone` | String | Số điện thoại người nhận | Required |
| `address` | String | Địa chỉ chi tiết | Required |
| `province` | String? | Mã tỉnh/thành phố | Optional |
| `district` | String? | Mã quận/huyện | Optional |
| `ward` | String? | Mã phường/xã | Optional |
| `provinceName` | String? | Tên tỉnh/thành phố | Optional |
| `districtName` | String? | Tên quận/huyện | Optional |
| `wardName` | String? | Tên phường/xã | Optional |
| `hamlet` | String? | Thôn/xóm | Optional |
| `isDefault` | Boolean | Địa chỉ mặc định | Default: false |
| `createdAt` | DateTime | Ngày tạo | Auto-generated |
| `updatedAt` | DateTime | Ngày cập nhật | Auto-updated |

### Quan Hệ (Relations)

- `user`: Thuộc về một người dùng (User) - Cascade Delete

---

## 3. Bảng Category (Danh Mục)

**Mô tả:** Lưu trữ các danh mục sản phẩm.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất của danh mục | Primary Key, CUID |
| `name` | String | Tên danh mục | Required |
| `description` | String? | Mô tả danh mục | Optional |
| `image` | String? | Hình ảnh danh mục | Optional |
| `createdAt` | DateTime | Ngày tạo | Auto-generated |

### Quan Hệ (Relations)

- `products`: Một danh mục có nhiều sản phẩm (Product[]) - Cascade Delete
- `specFields`: Một danh mục có nhiều trường thông số kỹ thuật (SpecField[]) - Cascade Delete

---

## 4. Bảng SpecField (Trường Thông Số Kỹ Thuật)

**Mô tả:** Định nghĩa các trường thông số kỹ thuật cho từng danh mục sản phẩm.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất của trường | Primary Key, CUID |
| `name` | String | Tên trường (ví dụ: "Màn hình", "RAM") | Required |
| `type` | String | Loại dữ liệu | Default: "TEXT" |
| `required` | Boolean | Bắt buộc nhập | Default: false |
| `unit` | String? | Đơn vị đo (ví dụ: "inch", "GB") | Optional |
| `categoryId` | String | ID danh mục | Foreign Key → Category.id |

### Quan Hệ (Relations)

- `category`: Thuộc về một danh mục (Category) - Cascade Delete
- `values`: Một trường có nhiều giá trị trong các sản phẩm (SpecValue[]) - Cascade Delete

---

## 5. Bảng Product (Sản Phẩm)

**Mô tả:** Lưu trữ thông tin sản phẩm.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất của sản phẩm | Primary Key, CUID |
| `name` | String | Tên sản phẩm | Required |
| `description` | String | Mô tả sản phẩm | Required |
| `price` | Float | Giá sản phẩm | Required |
| `stock` | Int | Số lượng tồn kho | Required |
| `image` | String | Đường dẫn hình ảnh | Required |
| `categoryId` | String | ID danh mục | Foreign Key → Category.id |
| `createdAt` | DateTime | Ngày tạo | Auto-generated |
| `updatedAt` | DateTime | Ngày cập nhật | Auto-updated |

### Quan Hệ (Relations)

- `category`: Thuộc về một danh mục (Category) - Cascade Delete
- `cartItems`: Một sản phẩm có trong nhiều giỏ hàng (CartItem[]) - Cascade Delete
- `orderItems`: Một sản phẩm có trong nhiều đơn hàng (OrderItem[]) - Cascade Delete
- `interactions`: Một sản phẩm có nhiều tương tác (ProductInteraction[]) - Cascade Delete
- `reviews`: Một sản phẩm có nhiều đánh giá (Review[]) - Cascade Delete
- `specs`: Một sản phẩm có nhiều giá trị thông số (SpecValue[]) - Cascade Delete

---

## 6. Bảng SpecValue (Giá Trị Thông Số)

**Mô tả:** Lưu trữ giá trị thông số kỹ thuật cụ thể cho từng sản phẩm.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất | Primary Key, CUID |
| `productId` | String | ID sản phẩm | Foreign Key → Product.id |
| `specFieldId` | String | ID trường thông số | Foreign Key → SpecField.id |
| `value` | String | Giá trị thông số | Required |

### Quan Hệ (Relations)

- `product`: Thuộc về một sản phẩm (Product) - Cascade Delete
- `specField`: Thuộc về một trường thông số (SpecField) - Cascade Delete

---

## 7. Bảng CartItem (Mục Giỏ Hàng)

**Mô tả:** Lưu trữ các sản phẩm trong giỏ hàng của người dùng.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất | Primary Key, CUID |
| `userId` | String | ID người dùng | Foreign Key → User.id |
| `productId` | String | ID sản phẩm | Foreign Key → Product.id |
| `quantity` | Int | Số lượng | Required |
| `createdAt` | DateTime | Ngày thêm vào giỏ | Auto-generated |

### Quan Hệ (Relations)

- `user`: Thuộc về một người dùng (User) - Cascade Delete
- `product`: Thuộc về một sản phẩm (Product) - Cascade Delete

---

## 8. Bảng Order (Đơn Hàng)

**Mô tả:** Lưu trữ thông tin đơn hàng của khách hàng.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất của đơn hàng | Primary Key, CUID |
| `userId` | String | ID người dùng | Foreign Key → User.id |
| `totalPrice` | Float | Tổng giá trị đơn hàng | Required |
| `status` | OrderStatus | Trạng thái đơn hàng | Default: PENDING |
| `paymentStatus` | PaymentStatus | Trạng thái thanh toán | Default: PENDING |
| `paymentMethod` | PaymentMethod | Phương thức thanh toán | Default: COD |
| `transactionId` | String? | ID giao dịch thanh toán | Optional |
| `ghnOrderCode` | String? | Mã đơn hàng GHN (Giao Hàng Nhanh) | Optional |
| `shippingName` | String? | Tên người nhận | Optional |
| `shippingPhone` | String? | Số điện thoại người nhận | Optional |
| `shippingAddress` | String? | Địa chỉ giao hàng | Optional |
| `shippingProvince` | String? | Tỉnh/thành phố giao hàng | Optional |
| `shippingDistrict` | String? | Quận/huyện giao hàng | Optional |
| `shippingWard` | String? | Phường/xã giao hàng | Optional |
| `shippingFee` | Float | Phí vận chuyển | Default: 0 |
| `createdAt` | DateTime | Ngày tạo đơn | Auto-generated |
| `updatedAt` | DateTime | Ngày cập nhật | Auto-updated |
| `paidAt` | DateTime? | Ngày thanh toán | Optional |

### Quan Hệ (Relations)

- `user`: Thuộc về một người dùng (User) - Cascade Delete
- `orderItems`: Một đơn hàng có nhiều mục (OrderItem[]) - Cascade Delete
- `reviews`: Một đơn hàng có thể có nhiều đánh giá (Review[]) - Cascade Delete

---

## 9. Bảng OrderItem (Mục Đơn Hàng)

**Mô tả:** Lưu trữ chi tiết các sản phẩm trong đơn hàng.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất | Primary Key, CUID |
| `orderId` | String | ID đơn hàng | Foreign Key → Order.id |
| `productId` | String | ID sản phẩm | Foreign Key → Product.id |
| `quantity` | Int | Số lượng | Required |
| `price` | Float | Giá tại thời điểm đặt hàng | Required |

### Quan Hệ (Relations)

- `order`: Thuộc về một đơn hàng (Order) - Cascade Delete
- `product`: Thuộc về một sản phẩm (Product) - Cascade Delete

---

## 10. Bảng Review (Đánh Giá)

**Mô tả:** Lưu trữ đánh giá và nhận xét của khách hàng về sản phẩm.

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất | Primary Key, CUID |
| `productId` | String | ID sản phẩm được đánh giá | Foreign Key → Product.id |
| `userId` | String | ID người đánh giá | Foreign Key → User.id |
| `orderId` | String? | ID đơn hàng (nếu đánh giá từ đơn hàng) | Foreign Key → Order.id, Optional |
| `rating` | Int | Điểm đánh giá (thường 1-5) | Required |
| `comment` | String | Nội dung đánh giá | Required |
| `createdAt` | DateTime | Ngày đánh giá | Auto-generated |

### Quan Hệ (Relations)

- `product`: Thuộc về một sản phẩm (Product) - Cascade Delete
- `user`: Thuộc về một người dùng (User) - Cascade Delete
- `order`: Có thể liên kết với một đơn hàng (Order?) - Cascade Delete

---

## 11. Bảng ProductInteraction (Tương Tác Sản Phẩm)

**Mô tả:** Theo dõi các hành vi tương tác của người dùng với sản phẩm (xem, thích, thêm vào giỏ, mua).

### Các Trường (Fields)

| Tên Trường | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
|------------|--------------|-------|-----------|
| `id` | String | ID duy nhất | Primary Key, CUID |
| `userId` | String | ID người dùng | Foreign Key → User.id |
| `productId` | String | ID sản phẩm | Foreign Key → Product.id |
| `viewedAt` | DateTime | Thời điểm xem | Auto-generated, Default: now() |
| `liked` | Boolean | Đã thích sản phẩm | Default: false |
| `addedToCart` | Boolean | Đã thêm vào giỏ hàng | Default: false |
| `purchased` | Boolean | Đã mua sản phẩm | Default: false |

### Quan Hệ (Relations)

- `product`: Thuộc về một sản phẩm (Product) - Cascade Delete
- `user`: Thuộc về một người dùng (User) - Cascade Delete

---

## Các Enum (Kiểu Liệt Kê)

### Role (Vai Trò)
- `CUSTOMER`: Khách hàng
- `ADMIN`: Quản trị viên

### OrderStatus (Trạng Thái Đơn Hàng)
- `PENDING`: Đang chờ xử lý
- `PROCESSING`: Đang xử lý
- `SHIPPING`: Đang giao hàng
- `COMPLETED`: Hoàn thành
- `CANCELLED`: Đã hủy

### PaymentStatus (Trạng Thái Thanh Toán)
- `PENDING`: Chưa thanh toán
- `PAID`: Đã thanh toán
- `REFUNDED`: Đã hoàn tiền

### PaymentMethod (Phương Thức Thanh Toán)
- `COD`: Thanh toán khi nhận hàng (Cash on Delivery)
- `ZALOPAY`: Thanh toán qua ZaloPay

---

## Sơ Đồ Quan Hệ Chính

```
User
├── Address[] (1:N)
├── CartItem[] (1:N)
├── Order[] (1:N)
├── ProductInteraction[] (1:N)
└── Review[] (1:N)

Category
├── Product[] (1:N)
└── SpecField[] (1:N)

Product
├── CartItem[] (1:N)
├── OrderItem[] (1:N)
├── ProductInteraction[] (1:N)
├── Review[] (1:N)
└── SpecValue[] (1:N)

Order
├── OrderItem[] (1:N)
└── Review[] (1:N)

SpecField
└── SpecValue[] (1:N)
```

---

## Ghi Chú Quan Trọng

1. **Cascade Delete**: Hầu hết các quan hệ đều sử dụng `onDelete: Cascade`, nghĩa là khi xóa bản ghi cha, các bản ghi con sẽ tự động bị xóa.

2. **CUID**: Hệ thống sử dụng CUID (Collision-resistant Unique Identifier) làm ID cho các bảng, đảm bảo tính duy nhất và an toàn.

3. **Timestamps**: Các bảng quan trọng có `createdAt` và `updatedAt` để theo dõi thời gian tạo và cập nhật.

4. **Soft Delete**: Bảng User có trường `isActive` để đánh dấu người dùng có còn hoạt động hay không, thay vì xóa trực tiếp.

5. **Price Snapshot**: Bảng `OrderItem` lưu giá sản phẩm tại thời điểm đặt hàng (`price`), đảm bảo giá trị đơn hàng không thay đổi khi giá sản phẩm thay đổi sau này.

---

*Tài liệu được tạo tự động từ Prisma Schema - Cập nhật lần cuối: 2025*

