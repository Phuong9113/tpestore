# ✅ Hoàn Thành Migration ID

## 📋 Tổng Quan

Đã tạo script migration để chuyển đổi tất cả ID từ format CUID sang format mới: **PREFIX + số thứ tự (4 chữ số)**.

## 🎯 Prefix Mapping

| Bảng | Prefix | Ví dụ |
|------|--------|-------|
| Category | CAT | CAT0001, CAT0002, ... |
| SpecField | SPF | SPF0001, SPF0002, ... |
| User | USR | USR0001, USR0002, ... |
| Product | PRD | PRD0001, PRD0002, ... |
| SpecValue | SPV | SPV0001, SPV0002, ... |
| Address | ADD | ADD0001, ADD0002, ... |
| CartItem | CRT | CRT0001, CRT0002, ... |
| Order | ORD | ORD0001, ORD0002, ... |
| OrderItem | ORI | ORI0001, ORI0002, ... |
| Review | REV | REV0001, REV0002, ... |
| ProductInteraction | PIN | PIN0001, PIN0002, ... |

## 📁 Files Đã Tạo/Cập Nhật

### 1. Script Migration
- **File:** `scripts/migrate-ids.js`
- **Chức năng:** Chuyển đổi tất cả ID hiện tại sang format mới
- **Thứ tự migration:** Theo dependency để đảm bảo foreign keys được cập nhật đúng

### 2. Hướng Dẫn Migration
- **File:** `scripts/MIGRATION_GUIDE.md`
- **Nội dung:** Hướng dẫn chi tiết cách chạy migration, backup, và rollback

### 3. Cập Nhật Code
- ✅ `backend/src/utils/generateId.js` - Đã cập nhật prefix mapping
- ✅ `backend/src/services/cart.service.js` - Đổi CIT → CRT
- ✅ `backend/src/services/order.service.js` - Đổi OIT → ORI

## 🚀 Cách Sử Dụng

### Bước 1: Backup Database
```bash
# PostgreSQL
pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Bước 2: Chạy Migration
```bash
node scripts/migrate-ids.js
```

### Bước 3: Verify
```bash
# Kiểm tra một vài records
psql -U postgres -d tpestore -c "SELECT id, name FROM \"Category\" LIMIT 5;"
psql -U postgres -d tpestore -c "SELECT id, name FROM \"Product\" LIMIT 5;"
```

## ⚠️ Lưu Ý Quan Trọng

1. **BACKUP BẮT BUỘC** - Luôn backup database trước khi chạy migration
2. **Tắt ứng dụng** - Đảm bảo không có transaction đang chạy
3. **Kiểm tra kết quả** - Sau migration, test toàn bộ chức năng
4. **Rollback** - Nếu có lỗi, restore từ backup

## 🔄 Thứ Tự Migration

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

1. **Test ứng dụng** - Đảm bảo tất cả chức năng hoạt động
2. **Kiểm tra API** - Test các endpoint CRUD
3. **Kiểm tra Frontend** - Đảm bảo UI hiển thị đúng
4. **Kiểm tra Foreign Keys** - Đảm bảo quan hệ giữa các bảng vẫn đúng

## 🐛 Xử Lý Lỗi

### Nếu Migration Thất Bại
1. Restore từ backup
2. Kiểm tra logs để xem lỗi ở đâu
3. Sửa lỗi và chạy lại

### Nếu Có Lỗi Foreign Key
- Script đã được thiết kế để xử lý FK constraints
- Nếu vẫn gặp lỗi, kiểm tra thứ tự migration

## 📝 Notes

- Migration sẽ mất thời gian tùy vào số lượng records
- Với database lớn (>10k records), có thể mất vài phút
- Script sẽ hiển thị progress và summary sau khi hoàn thành

---

**Tất cả đã sẵn sàng!** Bạn có thể chạy migration script khi đã backup database.

