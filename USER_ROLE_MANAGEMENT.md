# Hướng dẫn thay đổi Role và Trạng thái người dùng

## 🔒 Thay đổi Role và Trạng thái trong Database

Vai trò (role) và trạng thái (isActive) của người dùng được quản lý trực tiếp trong cơ sở dữ liệu để đảm bảo bảo mật.

## 📋 Các cách thay đổi:

### 1. **Sử dụng Prisma Studio (Khuyến nghị)**
```bash
npx prisma studio
```
- Mở trình duyệt tại `http://localhost:5555`
- Chọn bảng `User`
- Tìm người dùng cần thay đổi
- Click vào để chỉnh sửa
- Thay đổi `role` và `isActive`
- Lưu thay đổi

### 2. **Sử dụng SQL trực tiếp**
```bash
npx prisma db execute --stdin
```

#### Các lệnh SQL mẫu:

**Thay đổi role thành ADMIN:**
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
```

**Thay đổi role thành CUSTOMER:**
```sql
UPDATE "User" SET role = 'CUSTOMER' WHERE email = 'user@example.com';
```

**Kích hoạt tài khoản:**
```sql
UPDATE "User" SET "isActive" = true WHERE email = 'user@example.com';
```

**Vô hiệu hóa tài khoản:**
```sql
UPDATE "User" SET "isActive" = false WHERE email = 'user@example.com';
```

**Thay đổi cả role và trạng thái:**
```sql
UPDATE "User" 
SET role = 'ADMIN', "isActive" = true 
WHERE email = 'user@example.com';
```

### 3. **Sử dụng Prisma Client trong script**
```javascript
import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

// Thay đổi role
await prisma.user.update({
  where: { email: 'user@example.com' },
  data: { role: 'ADMIN' }
})

// Thay đổi trạng thái
await prisma.user.update({
  where: { email: 'user@example.com' },
  data: { isActive: true }
})
```

## 📝 Các giá trị hợp lệ:

### Role:
- `CUSTOMER` - Khách hàng
- `ADMIN` - Quản trị viên

### isActive:
- `true` - Tài khoản hoạt động
- `false` - Tài khoản bị vô hiệu hóa

## ⚠️ Lưu ý quan trọng:

1. **Luôn backup database** trước khi thay đổi
2. **Kiểm tra kỹ email** trước khi thực hiện lệnh UPDATE
3. **Không xóa tài khoản ADMIN cuối cùng** trong hệ thống
4. **Ghi log** các thay đổi quan trọng

## 🔍 Kiểm tra thay đổi:

```sql
-- Xem tất cả người dùng
SELECT id, name, email, role, "isActive", "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- Xem chỉ ADMIN
SELECT id, name, email, role, "isActive" 
FROM "User" 
WHERE role = 'ADMIN';

-- Xem tài khoản bị vô hiệu hóa
SELECT id, name, email, role, "isActive" 
FROM "User" 
WHERE "isActive" = false;
```
