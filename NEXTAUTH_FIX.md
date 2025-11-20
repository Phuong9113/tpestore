# Sửa lỗi NextAuth Google OAuth

## Các thay đổi đã thực hiện

### 1. ✅ Sửa route handler NextAuth (`src/app/api/auth/[...nextauth]/route.ts`)
- Cập nhật export GET và POST để tương thích với Next.js 15 App Router
- Thêm type safety cho params
- Giữ nguyên logic callbacks và backend integration

### 2. ✅ Tạo middleware (`src/middleware.ts`)
- Thêm header `ngrok-skip-browser-warning: 1` cho tất cả requests
- Giúp bỏ cảnh báo ngrok khi redirect

## Kiểm tra cấu hình

### 1. Biến môi trường (`.env` hoặc `.env.local`)
Đảm bảo có các biến sau:

```env
GOOGLE_CLIENT_ID="34898162284-g608rr1fnteg6rrf85pqvu2l49q3cft0.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-U...4W7nM21E_chE"
NEXTAUTH_SECRET="<chuỗi-bí-mật-32-ký-tự>"
NEXTAUTH_URL="https://dorie-funnier-lesha.ngrok-free.dev"
```

**Quan trọng:**
- `NEXTAUTH_URL` phải là domain gốc (không có `/api/auth/...`)
- Phải khớp với domain ngrok hiện tại

### 2. Google Cloud Console
Đảm bảo đã cấu hình:

**Authorized JavaScript origins:**
```
https://dorie-funnier-lesha.ngrok-free.dev
```

**Authorized redirect URIs:**
```
https://dorie-funnier-lesha.ngrok-free.dev/api/auth/callback/google
```

### 3. Kiểm tra route hoạt động

1. **Khởi động server:**
   ```bash
   npm run dev
   ```

2. **Truy cập test route:**
   - Mở: `https://dorie-funnier-lesha.ngrok-free.dev/api/auth/signin`
   - Nếu thấy trang đăng nhập NextAuth → route hoạt động ✅
   - Nếu lỗi 404 → kiểm tra lại cấu hình

3. **Test đăng nhập Google:**
   - Vào trang `/login`
   - Nhấn "Đăng nhập với Google"
   - Nếu redirect về Google và quay lại thành công → hoạt động ✅

## Debug nếu vẫn lỗi

### Kiểm tra console logs
- Mở DevTools → Console
- Xem có lỗi gì khi click nút Google

### Kiểm tra Network tab
- Xem request đến `/api/auth/callback/google`
- Kiểm tra status code và response

### Kiểm tra server logs
- Xem terminal chạy `npm run dev`
- Tìm các log từ NextAuth (có prefix `[NextAuth]`)

### Các lỗi thường gặp

1. **"Cannot GET /api/auth/callback/google"**
   - ✅ Đã sửa: Route handler đã được cập nhật đúng cách
   - Nếu vẫn lỗi: Kiểm tra Next.js version và NextAuth version

2. **"redirect_uri_mismatch"**
   - Kiểm tra Google Console có đúng redirect URI
   - Kiểm tra `NEXTAUTH_URL` trong `.env`

3. **"Missing environment variable"**
   - Kiểm tra file `.env` có đầy đủ biến
   - Restart server sau khi thêm biến môi trường

## Files đã thay đổi

1. `src/app/api/auth/[...nextauth]/route.ts` - Route handler NextAuth
2. `src/middleware.ts` - Middleware thêm header ngrok (mới tạo)

## Next steps

Sau khi sửa xong:
1. Restart Next.js dev server
2. Test đăng nhập Google
3. Kiểm tra user được tạo trong database với `provider = GOOGLE`
4. Kiểm tra token được lưu vào `localStorage` với key `tpestore_token`

