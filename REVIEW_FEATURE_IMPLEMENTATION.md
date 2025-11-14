# Tài liệu triển khai tính năng "Đánh giá sản phẩm sau khi giao hàng"

## Tổng quan

Tính năng cho phép người dùng đánh giá sản phẩm sau khi đơn hàng đã được giao thành công. Tính năng này bao gồm:
- Hiển thị nút đánh giá trên trang chi tiết đơn hàng
- Form đánh giá với rating (1-5 sao) và bình luận
- Hiển thị danh sách đánh giá trên trang chi tiết sản phẩm
- Tính toán và hiển thị điểm trung bình
- Phân trang cho danh sách đánh giá

## Các file đã chỉnh sửa/thêm mới

### Backend

#### 1. Database Schema
- **File**: `prisma/schema.prisma`
- **Thay đổi**: 
  - Thêm trường `orderId` (optional) vào model `Review`
  - Thêm relation `reviews` vào model `Order`
- **Migration**: `prisma/migrations/20251112043436_add_orderId_to_review/migration.sql`

#### 2. Services
- **File**: `backend/src/services/product.service.js`
  - Cập nhật `createReview()`: 
    - Validate rating (1-5)
    - Kiểm tra order status (COMPLETED hoặc GHN status = delivered)
    - Kiểm tra product có trong order
    - Ngăn chặn duplicate review cho cùng product trong cùng order
  - Cập nhật `getReviews()`: 
    - Thêm pagination
    - Tính toán average rating

- **File**: `backend/src/services/order.service.js`
  - Thêm `getReviewEligibility()`: 
    - Kiểm tra order status
    - Lấy danh sách products trong order
    - Kiểm tra products nào đã được review
    - Trả về trạng thái review cho từng product

#### 3. Controllers
- **File**: `backend/src/controllers/product.controller.js`
  - Cập nhật `getProductReviews()`: Hỗ trợ pagination
  - Cập nhật `createProductReview()`: Nhận thêm `orderId` từ request body

- **File**: `backend/src/controllers/order.controller.js`
  - Thêm `getReviewEligibility()`: Controller cho endpoint kiểm tra review eligibility

#### 4. Routes
- **File**: `backend/src/routes/v1/products.routes.js`
  - Route `GET /:productId/reviews` đã có sẵn (public)
  - Route `POST /:productId/reviews` đã có sẵn (protected)

- **File**: `backend/src/routes/v1/orders.routes.js`
  - Thêm route `GET /:id/review-eligibility` (protected)

### Frontend

#### 1. Components
- **File mới**: `src/components/ReviewModal.tsx`
  - Modal form để submit review
  - Star rating selector (1-5)
  - Textarea cho comment
  - Validation và error handling

- **File mới**: `src/components/ReviewButton.tsx`
  - Button hiển thị "Đánh giá sản phẩm" hoặc "Đã đánh giá"
  - Disabled state khi đã review

- **File mới**: `src/components/ProductReviews.tsx`
  - Component hiển thị danh sách reviews
  - Tính toán và hiển thị average rating
  - Pagination cho reviews
  - Format date và user info

#### 2. Pages
- **File**: `src/app/(store)/profile/page.tsx`
  - Thêm state cho review eligibility
  - Fetch review eligibility khi mở order detail
  - Hiển thị ReviewButton cho mỗi product trong order
  - Integrate ReviewModal

- **File**: `src/app/(store)/products/[id]/page.tsx`
  - Thêm ProductReviews component vào product detail page

#### 3. API Client
- **File**: `src/lib/api.ts`
  - Thêm interfaces: `Review`, `ReviewEligibility`, `ReviewsResponse`
  - Thêm functions:
    - `getReviewEligibility(orderId)`: Lấy review eligibility cho order
    - `createReview(productId, data)`: Tạo review mới
    - `getProductReviews(productId, page, limit)`: Lấy danh sách reviews với pagination

## Cách sử dụng API

### 1. Kiểm tra review eligibility
```typescript
GET /api/v1/orders/:orderId/review-eligibility
Headers: Authorization: Bearer <token>

Response:
{
  orderId: string,
  canReview: boolean,
  isCompleted: boolean,
  isDelivered: boolean,
  items: [
    {
      id: string,
      productId: string,
      quantity: number,
      price: number,
      canReview: boolean,
      hasReviewed: boolean,
      product: { id, name, image }
    }
  ]
}
```

### 2. Tạo review
```typescript
POST /api/v1/products/:productId/reviews
Headers: Authorization: Bearer <token>
Body: {
  rating: number (1-5),
  comment: string,
  orderId?: string (optional)
}

Response: Review object
```

### 3. Lấy danh sách reviews
```typescript
GET /api/v1/products/:productId/reviews?page=1&limit=10
(Public, không cần auth)

Response: {
  reviews: Review[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  averageRating: number
}
```

## Validation Rules

1. **Rating**: Phải từ 1 đến 5
2. **Comment**: Bắt buộc, không được để trống
3. **Order Status**: Order phải có status = COMPLETED hoặc GHN status = "delivered"
4. **Product in Order**: Product phải có trong order
5. **Duplicate Prevention**: Một product trong một order chỉ được review một lần

## UI/UX Flow

1. User vào trang Profile > Lịch sử đơn hàng
2. Click "Xem chi tiết" cho một order đã giao
3. Nếu order đã giao (COMPLETED hoặc GHN delivered):
   - Mỗi product trong order sẽ hiển thị nút "Đánh giá sản phẩm"
   - Nếu đã review, hiển thị "Đã đánh giá" (disabled)
4. Click "Đánh giá sản phẩm" → Mở ReviewModal
5. Chọn rating (1-5 sao) và nhập comment
6. Submit → Review được lưu, button chuyển thành "Đã đánh giá"
7. Trên trang Product Detail, tất cả reviews được hiển thị với:
   - Average rating
   - Danh sách reviews với pagination
   - User info và date

## Đề xuất cải tiến

1. **Performance**: 
   - Cache review eligibility để giảm số lần gọi API
   - Sử dụng React Query hoặc SWR cho data fetching

2. **UX**:
   - Thêm loading states cho các actions
   - Thêm confirmation dialog trước khi submit
   - Hiển thị review count trên product card

3. **Features**:
   - Cho phép edit/delete review
   - Thêm image upload cho review
   - Filter reviews theo rating
   - Sort reviews (newest, oldest, highest rating, lowest rating)

4. **Security**:
   - Rate limiting cho review creation
   - Spam detection
   - Moderation system

5. **Code Quality**:
   - Thêm unit tests cho services
   - Thêm integration tests cho API endpoints
   - Thêm E2E tests cho review flow

## Lưu ý

- Migration cần được chạy trước khi deploy: `npx prisma migrate deploy`
- Backend cần restart sau khi thêm routes mới
- Frontend cần rebuild sau khi thêm components mới
- Đảm bảo GHN service đang hoạt động để check delivery status chính xác

