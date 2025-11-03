-- ============================================
-- CẤU TRÚC DATABASE TPE STORE
-- ============================================

-- 1. USER (Người dùng)
-- Fields:
--   id: String (CUID) - Primary Key
--   name: String (optional)
--   email: String (unique, required)
--   password: String (required)
--   phone: String (optional)
--   address: String (optional)
--   city: String (optional)
--   role: Role enum (CUSTOMER | ADMIN) - default: CUSTOMER
--   isActive: Boolean - default: true
--   createdAt: DateTime - auto
--   updatedAt: DateTime - auto

INSERT INTO "User" (id, name, email, password, phone, address, city, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'user_001',
  'Nguyễn Văn A',
  'user1@example.com',
  '$2b$10$hashedpassword', -- Mật khẩu đã hash
  '0912345678',
  '123 Đường ABC',
  'Hà Nội',
  'CUSTOMER',
  true,
  NOW(),
  NOW()
);


-- 2. ADDRESS (Địa chỉ)
-- Fields:
--   id: String (CUID) - Primary Key
--   userId: String - Foreign Key → User.id
--   name: String (required)
--   phone: String (required)
--   address: String (required)
--   province: String (optional)
--   district: String (optional)
--   ward: String (optional)
--   provinceName: String (optional)
--   districtName: String (optional)
--   wardName: String (optional)
--   hamlet: String (optional)
--   isDefault: Boolean - default: false
--   createdAt: DateTime - auto
--   updatedAt: DateTime - auto

INSERT INTO "Address" (id, "userId", name, phone, address, province, district, ward, "provinceName", "districtName", "wardName", hamlet, "isDefault", "createdAt", "updatedAt")
VALUES (
  'addr_001',
  'user_001',
  'Nguyễn Văn A',
  '0912345678',
  '123 Đường ABC',
  ',
  '79', -- Mã tỉnh/thành phố
  '760', -- Mã quận/huyện
  '26668', -- Mã phường/xã
  'Hồ Chí Minh',
  'Quận 1',
  'Phường Bến Nghé',
  NULL,
  true,
  NOW(),
  NOW()
);


-- 3. CATEGORY (Danh mục sản phẩm)
-- Fields:
--   id: String (CUID) - Primary Key
--   name: String (required)
--   description: String (optional)
--   image: String (optional) - URL hoặc path
--   createdAt: DateTime - auto
--   products: Product[] - relation
--   specFields: SpecField[] - relation

INSERT INTO "Category" (id, name, description, image, "createdAt")
VALUES (
  'cat_001',
  'Laptop',
  'Máy tính xách tay các loại',
  '/images/categories/laptop.jpg',
  NOW()
);

INSERT INTO "Category" (id, name, description, image, "createdAt")
VALUES (
  'cat_002',
  'Smartphone',
  'Điện thoại thông minh',
  '/images/categories/smartphone.jpg',
  NOW()
);

INSERT INTO "Category" (id, name, description, image, "createdAt")
VALUES (
  'cat_003',
  'Tablet',
  'Máy tính bảng',
  '/images/categories/tablet.jpg',
  NOW()
);


-- 4. SPECFIELD (Trường thông số kỹ thuật)
-- Fields:
--   id: String (CUID) - Primary Key
--   name: String (required)
--   type: String - default: "TEXT"
--   required: Boolean - default: false
--   unit: String (optional)
--   categoryId: String - Foreign Key → Category.id
--   values: SpecValue[] - relation

INSERT INTO "SpecField" (id, name, type, required, unit, "categoryId")
VALUES (
  'spec_001',
  'RAM',
  'NUMBER',
  true,
  'GB',
  'cat_001' -- Laptop
);

INSERT INTO "SpecField" (id, name, type, required, unit, "categoryId")
VALUES (
  'spec_002',
  'Ổ cứng',
  'TEXT',
  true,
  NULL,
  'cat_001' -- Laptop
);

INSERT INTO "SpecField" (id, name, type, required, unit, "categoryId")
VALUES (
  'spec_003',
  'Màn hình',
  'NUMBER',
  true,
  'inch',
  'cat_001' -- Laptop
);


-- 5. PRODUCT (Sản phẩm)
-- Fields:
--   id: String (CUID) - Primary Key
--   name: String (required)
--   description: String (required)
--   price: Float (required)
--   stock: Int (required)
--   image: String (required) - URL hoặc path
--   categoryId: String - Foreign Key → Category.id
--   createdAt: DateTime - auto
--   updatedAt: DateTime - auto

INSERT INTO "Product" (id, name, description, price, stock, image, "categoryId", "createdAt", "updatedAt")
VALUES (
  'prod_001',
  'Laptop Dell XPS 15',
  'Laptop cao cấp với màn hình 15 inch, CPU Intel i7, RAM 16GB',
  25000000,
  10,
  '/uploads/image-laptop-dell.jpg',
  'cat_001',
  NOW(),
  NOW()
);

INSERT INTO "Product" (id, name, description, price, stock, image, "categoryId", "createdAt", "updatedAt")
VALUES (
  'prod_002',
  'iPhone 15 Pro Max',
  'Điện thoại flagship của Apple với chip A17 Pro',
  35000000,
  20,
  '/uploads/image-iphone.jpg',
  'cat_002',
  NOW(),
  NOW()
);


-- 6. SPECVALUE (Giá trị thông số kỹ thuật)
-- Fields:
--   id: String (CUID) - Primary Key
--   productId: String - Foreign Key → Product.id
--   specFieldId: String - Foreign Key → SpecField.id
--   value: String (required)

INSERT INTO "SpecValue" (id, "productId", "specFieldId", value)
VALUES (
  'specval_001',
  'prod_001',
  'spec_001',
  '16'
);

INSERT INTO "SpecValue" (id, "productId", "specFieldId", value)
VALUES (
  'specval_002',
  'prod_001',
  'spec_002',
  'SSD 512GB'
);

INSERT INTO "SpecValue" (id, "productId", "specFieldId", value)
VALUES (
  'specval_003',
  'prod_001',
  'spec_003',
  '15.6'
);


-- 7. CARTITEM (Giỏ hàng)
-- Fields:
--   id: String (CUID) - Primary Key
--   userId: String - Foreign Key → User.id
--   productId: String - Foreign Key → Product.id
--   quantity: Int (required)
--   createdAt: DateTime - auto

INSERT INTO "CartItem" (id, "userId", "productId", quantity, "createdAt")
VALUES (
  'cart_001',
  'user_001',
  'prod_001',
  2,
  NOW()
);


-- 8. ORDER (Đơn hàng)
-- Fields:
--   id: String (CUID) - Primary Key
--   userId: String - Foreign Key → User.id
--   totalPrice: Float (required)
--   status: OrderStatus enum (PENDING | PROCESSING | SHIPPING | COMPLETED | CANCELLED) - default: PENDING
--   paymentStatus: PaymentStatus enum (PENDING | PAID | REFUNDED) - default: PENDING
--   createdAt: DateTime - auto
--   updatedAt: DateTime - auto
--   paidAt: DateTime (optional)
--   transactionId: String (optional)
--   paymentMethod: PaymentMethod enum (COD | ZALOPAY) - default: COD
--   ghnOrderCode: String (optional) - Mã đơn hàng từ GHN
--   shippingName: String (optional)
--   shippingPhone: String (optional)
--   shippingAddress: String (optional)
--   shippingProvince: String (optional)
--   shippingDistrict: String (optional)
--   shippingWard: String (optional)
--   shippingFee: Float - default: 0

INSERT INTO "Order" (
  id, "userId", "totalPrice", status, "paymentStatus", 
  "createdAt", "updatedAt", "paidAt", "transactionId", 
  "paymentMethod", "ghnOrderCode", "shippingName", "shippingPhone", 
  "shippingAddress", "shippingProvince", "shippingDistrict", 
  "shippingWard", "shippingFee"
)
VALUES (
  'order_001',
  'user_001',
  50000000,
  'PENDING',
  'PENDING',
  NOW(),
  NOW(),
  NULL,
  NULL,
  'COD',
  NULL,
  'Nguyễn Văn A',
  '0912345678',
  '123 Đường ABC',
  'Hồ Chí Minh',
  'Quận 1',
  'Phường Bến Nghé',
  30000
);


-- 9. ORDERITEM (Chi tiết đơn hàng)
-- Fields:
--   id: String (CUID) - Primary Key
--   orderId: String - Foreign Key → Order.id
--   productId: String - Foreign Key → Product.id
--   quantity: Int (required)
--   price: Float (required) - Giá tại thời điểm mua

INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, price)
VALUES (
  'orderitem_001',
  'order_001',
  'prod_001',
  2,
  25000000
);


-- 10. REVIEW (Đánh giá)
-- Fields:
--   id: String (CUID) - Primary Key
--   productId: String - Foreign Key → Product.id
--   userId: String - Foreign Key → User.id
--   rating: Int (required) - Thường từ 1-5
--   comment: String (required)
--   createdAt: DateTime - auto

INSERT INTO "Review" (id, "productId", "userId", rating, comment, "createdAt")
VALUES (
  'review_001',
  'prod_001',
  'user_001',
  5,
  'Sản phẩm rất tốt, giao hàng nhanh!',
  NOW()
);


-- 11. PRODUCTINTERACTION (Tương tác sản phẩm)
-- Fields:
--   id: String (CUID) - Primary Key
--   userId: String - Foreign Key → User.id
--   productId: String - Foreign Key → Product.id
--   viewedAt: DateTime - default: now()
--   liked: Boolean - default: false
--   addedToCart: Boolean - default: false
--   purchased: Boolean - default: false

INSERT INTO "ProductInteraction" (id, "userId", "productId", "viewedAt", liked, "addedToCart", purchased)
VALUES (
  'interaction_001',
  'user_001',
  'prod_001',
  NOW(),
  true,
  true,
  false
);


-- ============================================
-- ENUMS (Kiểu dữ liệu liệt kê)
-- ============================================

-- Role: CUSTOMER | ADMIN
-- OrderStatus: PENDING | PROCESSING | SHIPPING | COMPLETED | CANCELLED
-- PaymentStatus: PENDING | PAID | REFUNDED
-- PaymentMethod: COD | ZALOPAY


-- ============================================
-- QUAN HỆ GIỮA CÁC BẢNG
-- ============================================

-- User → Address (1:N)
-- User → CartItem (1:N)
-- User → Order (1:N)
-- User → Review (1:N)
-- User → ProductInteraction (1:N)

-- Category → Product (1:N)
-- Category → SpecField (1:N)

-- Product → CartItem (1:N)
-- Product → OrderItem (1:N)
-- Product → Review (1:N)
-- Product → ProductInteraction (1:N)
-- Product → SpecValue (1:N)

-- SpecField → SpecValue (1:N)

-- Order → OrderItem (1:N)

-- ============================================
-- LƯU Ý KHI INSERT DATA
-- ============================================

-- 1. ID phải là CUID (do Prisma generate tự động)
-- 2. Foreign keys phải tồn tại trước khi insert
-- 3. Enum values phải đúng với định nghĩa
-- 4. Password phải được hash (dùng bcrypt)
-- 5. Dates: Sử dụng NOW() hoặc timestamp
-- 6. Cascade delete: Khi xóa parent, child sẽ tự động bị xóa

