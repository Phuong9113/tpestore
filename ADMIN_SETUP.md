# Hướng dẫn thiết lập phân quyền Admin

## Tổng quan
Hệ thống đã được cập nhật để hỗ trợ phân quyền dựa trên role:
- **ADMIN**: Có thể truy cập dashboard admin, xem thông tin cá nhân và đăng xuất
- **CUSTOMER**: Chỉ có thể xem thông tin cá nhân và đăng xuất (không có dashboard admin)

## Cách tạo tài khoản Admin

### 1. Chạy script tạo admin
```bash
npm run create-admin
```

Script này sẽ tạo một tài khoản admin với thông tin:
- Email: `admin@tpestore.com`
- Password: `admin123`
- Role: `ADMIN`

### 2. Đăng nhập với tài khoản admin
1. Truy cập `/login`
2. Nhập email: `admin@tpestore.com`
3. Nhập password: `admin123`
4. Sau khi đăng nhập thành công, bạn sẽ được chuyển hướng đến `/admin`

## Tính năng phân quyền

### Cho Admin (role: ADMIN)
- ✅ Truy cập dashboard admin tại `/admin`
- ✅ Xem thông tin cá nhân tại `/profile`
- ✅ Có nút "Dashboard Admin" trong menu dropdown
- ✅ Có nút "Dashboard Admin" trong profile page
- ✅ Đăng xuất

### Cho Customer (role: CUSTOMER)
- ✅ Xem thông tin cá nhân tại `/profile`
- ✅ Đăng xuất
- ❌ Không thể truy cập `/admin` (sẽ bị chuyển hướng về login)
- ❌ Không thấy nút "Dashboard Admin" trong menu

## Cách thay đổi role của user

### Thông qua database
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
```

### Thông qua Prisma Studio
1. Chạy `npx prisma studio`
2. Tìm user cần thay đổi
3. Cập nhật field `role` thành `ADMIN`

## Bảo mật

- Tất cả routes `/admin/*` đều được bảo vệ bởi middleware `requireAdmin()`
- User không có role ADMIN sẽ bị chuyển hướng về trang login
- JWT token chứa thông tin role để xác thực
- Backend kiểm tra role trong mỗi request

## Cấu trúc file đã thay đổi

### Frontend
- `src/lib/admin-auth.ts` - Middleware kiểm tra quyền admin
- `src/app/login/page.tsx` - Redirect dựa trên role sau login
- `src/app/register/page.tsx` - User mới luôn có role CUSTOMER
- `src/app/profile/page.tsx` - Hiển thị role và nút admin
- `src/app/admin/layout.tsx` - Bảo vệ admin routes
- `src/components/Header.tsx` - Menu dropdown theo role
- `src/components/admin/AdminHeader.tsx` - Header admin với thông tin user

### Backend
- `backend/server.js` - Đã có sẵn xử lý role trong JWT
- Schema Prisma đã có enum Role với CUSTOMER và ADMIN

### Scripts
- `scripts/create-admin.js` - Script tạo admin user
- `package.json` - Thêm script `create-admin`
