# Tóm Tắt Refactoring ID Generation

## 📋 Tổng Quan

Đã refactor toàn bộ hệ thống để thay đổi cách tạo ID từ CUID() sang format prefix + số tự động (ví dụ: USR0001, PRD0001).

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. Tạo Helper Function `generateId`

**File:** `backend/src/utils/generateId.js`

- Function tạo ID với format: `PREFIX + số tự động (4 chữ số)`
- Sử dụng Prisma transaction để tránh race condition
- Hỗ trợ tất cả 11 bảng trong database

**Prefix mapping:**
- User → USR
- Address → ADD
- Category → CAT
- SpecField → SPF
- Product → PRD
- SpecValue → SPV
- CartItem → CIT
- Order → ORD
- OrderItem → OIT
- Review → REV
- ProductInteraction → PIN

### 2. Cập Nhật Prisma Schema

**File:** `prisma/schema.prisma`

- Đã xóa `@default(cuid())` từ tất cả 11 bảng
- ID giờ phải được tạo thủ công trước khi insert

### 3. Cập Nhật Tất Cả Create Operations

#### Services:
- ✅ `backend/src/services/auth.service.js` - User creation
- ✅ `backend/src/services/cart.service.js` - CartItem creation
- ✅ `backend/src/services/order.service.js` - Order & OrderItem creation
- ✅ `backend/src/services/product.service.js` - Review & ProductInteraction creation

#### Repositories:
- ✅ `backend/src/repositories/address.repository.js` - Address creation
- ✅ `backend/src/repositories/category.repository.js` - Category creation
- ✅ `backend/src/repositories/product.repository.js` - Product creation
- ✅ `backend/src/repositories/order.repository.js` - Order creation (backup method)
- ✅ `backend/src/repositories/user.repository.js` - User creation (backup method)

#### Controllers:
- ✅ `backend/src/controllers/admin.controller.js` - Product, Category, SpecField, SpecValue creation

#### Scripts:
- ✅ `scripts/create-admin.js` - Admin user creation

## 🔄 Migration Instructions

### Bước 1: Tạo Migration Mới

```bash
npx prisma migrate dev --name remove_cuid_defaults
```

**LƯU Ý QUAN TRỌNG:** Migration này sẽ:
- Xóa `@default(cuid())` từ schema
- **KHÔNG** thay đổi dữ liệu hiện có
- Dữ liệu cũ vẫn giữ nguyên ID CUID

### Bước 2: Xử Lý Dữ Liệu Hiện Có

Bạn có 2 lựa chọn:

#### Option A: Giữ Dữ Liệu Cũ (Khuyến Nghị cho Production)

Nếu bạn có dữ liệu quan trọng, có thể:
1. Giữ nguyên ID cũ (CUID format)
2. Chỉ áp dụng ID mới cho dữ liệu mới được tạo
3. Hệ thống sẽ hoạt động bình thường với cả 2 loại ID

#### Option B: Xóa và Tạo Lại (Chỉ cho Dev/Test)

Nếu đây là môi trường dev/test và bạn muốn dữ liệu sạch:

```bash
# Xóa tất cả dữ liệu
npx prisma migrate reset

# Chạy lại migration
npx prisma migrate dev

# Tạo lại admin user
node scripts/create-admin.js
```

### Bước 3: Generate Prisma Client

```bash
npx prisma generate
```

### Bước 4: Test Hệ Thống

1. Test đăng ký user mới → ID sẽ là USR0001, USR0002, ...
2. Test tạo sản phẩm mới → ID sẽ là PRD0001, PRD0002, ...
3. Test tạo đơn hàng → ID sẽ là ORD0001, ORD0002, ...
4. Kiểm tra tất cả các chức năng tạo dữ liệu

## ⚠️ Lưu Ý Quan Trọng

1. **Race Condition Protection:** Function `generateId` sử dụng Prisma transaction để đảm bảo không có ID trùng lặp khi có nhiều request đồng thời.

2. **Backward Compatibility:** Hệ thống vẫn có thể đọc dữ liệu cũ với ID CUID. Chỉ có dữ liệu mới được tạo sẽ dùng format mới.

3. **ID Format:** 
   - Format: `PREFIX + 4 chữ số` (ví dụ: USR0001, PRD0001)
   - Số sẽ tự động tăng từ 0001
   - Tối đa 9999 records mỗi bảng (có thể mở rộng sau nếu cần)

4. **Performance:** Function `generateId` query tất cả records để tìm max ID. Với database lớn, có thể cần optimize sau bằng cách:
   - Sử dụng database sequence
   - Cache max ID
   - Sử dụng Redis counter

## 🧪 Testing Checklist

- [ ] Đăng ký user mới
- [ ] Tạo category mới
- [ ] Tạo product mới (với specs)
- [ ] Thêm vào giỏ hàng
- [ ] Tạo đơn hàng
- [ ] Tạo review
- [ ] Tạo address
- [ ] Import products từ Excel
- [ ] Tạo admin user qua script

## 📝 Files Changed

1. `backend/src/utils/generateId.js` (NEW)
2. `prisma/schema.prisma`
3. `backend/src/services/auth.service.js`
4. `backend/src/services/cart.service.js`
5. `backend/src/services/order.service.js`
6. `backend/src/services/product.service.js`
7. `backend/src/repositories/address.repository.js`
8. `backend/src/repositories/category.repository.js`
9. `backend/src/repositories/product.repository.js`
10. `backend/src/repositories/order.repository.js`
11. `backend/src/repositories/user.repository.js`
12. `backend/src/controllers/admin.controller.js`
13. `scripts/create-admin.js`

## 🚀 Next Steps

1. Chạy migration: `npx prisma migrate dev --name remove_cuid_defaults`
2. Generate Prisma client: `npx prisma generate`
3. Test toàn bộ hệ thống
4. Deploy lên môi trường staging để test
5. Nếu mọi thứ OK, deploy lên production

---

*Tài liệu được tạo tự động sau khi refactoring - 2025*

