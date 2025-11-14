# Hướng Dẫn Migration ID

## ⚠️ QUAN TRỌNG: Đọc kỹ trước khi chạy!

Script này sẽ **chuyển đổi tất cả ID hiện tại** từ format CUID sang format mới (PREFIX + số thứ tự).

## 📋 Yêu Cầu Trước Khi Chạy

1. **BACKUP DATABASE** - Đây là bước BẮT BUỘC!
   ```bash
   # PostgreSQL backup
   pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Đảm bảo không có transaction đang chạy** - Tắt tất cả ứng dụng đang kết nối database

3. **Kiểm tra kết nối database** - Đảm bảo `DATABASE_URL` trong `.env` đúng

## 🚀 Cách Chạy Migration

### Bước 1: Backup Database
```bash
# Tạo backup
pg_dump -U postgres -d tpestore > backup_before_migration.sql
```

### Bước 2: Chạy Script Migration
```bash
node scripts/migrate-ids.js
```

### Bước 3: Kiểm Tra Kết Quả
Script sẽ hiển thị:
- Số lượng records đã migrate cho mỗi bảng
- Tổng kết migration
- Lỗi nếu có

### Bước 4: Verify Database
```bash
# Kiểm tra một vài records
psql -U postgres -d tpestore -c "SELECT id, name FROM \"Category\" LIMIT 5;"
psql -U postgres -d tpestore -c "SELECT id, name FROM \"Product\" LIMIT 5;"
psql -U postgres -d tpestore -c "SELECT id, email FROM \"User\" LIMIT 5;"
```

## 🔄 Rollback (Nếu Cần)

Nếu migration thất bại hoặc cần rollback:

```bash
# Restore từ backup
psql -U postgres -d tpestore < backup_before_migration.sql
```

## 📊 Thứ Tự Migration

Script sẽ migrate theo thứ tự sau để đảm bảo foreign keys được cập nhật đúng:

1. **Category** (không có FK)
2. **User** (không có FK)
3. **SpecField** (FK: categoryId)
4. **Product** (FK: categoryId)
5. **SpecValue** (FK: productId, specFieldId)
6. **Address** (FK: userId)
7. **CartItem** (FK: userId, productId)
8. **Order** (FK: userId)
9. **OrderItem** (FK: orderId, productId)
10. **Review** (FK: productId, userId, orderId?)
11. **ProductInteraction** (FK: userId, productId)

## ✅ Sau Khi Migration

1. **Test ứng dụng** - Đảm bảo tất cả chức năng hoạt động bình thường
2. **Kiểm tra API** - Test các endpoint CRUD
3. **Kiểm tra Frontend** - Đảm bảo UI hiển thị đúng

## 🐛 Xử Lý Lỗi

### Lỗi Foreign Key Constraint
- Script đã được thiết kế để xử lý FK constraints
- Nếu vẫn gặp lỗi, kiểm tra thứ tự migration

### Lỗi Duplicate ID
- Script sẽ bỏ qua nếu ID đã tồn tại
- Kiểm tra logs để xem records nào bị bỏ qua

### Lỗi Connection
- Đảm bảo database đang chạy
- Kiểm tra `DATABASE_URL` trong `.env`

## 📝 Notes

- Migration sẽ mất thời gian tùy vào số lượng records
- Với database lớn (>10k records), có thể mất vài phút
- Script sử dụng transaction để đảm bảo tính nhất quán

---

**Lưu ý:** Sau khi migration, tất cả ID mới sẽ theo format:
- Category: CAT0001, CAT0002, ...
- Product: PRD0001, PRD0002, ...
- User: USR0001, USR0002, ...
- Và tương tự cho các bảng khác

