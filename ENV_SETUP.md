# Hướng dẫn cấu hình Environment Variables

## File `.env` hoặc `.env.local`

Tạo file `.env` hoặc `.env.local` trong thư mục gốc dự án với nội dung sau:

### Khi chạy local (không dùng ngrok):

```env
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="34898162284-g608rr1fnteg6rrf85pqvu2l49q3cft0.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
NEXTAUTH_SECRET="jgg44ygIGk3ozUBWd5npQ86MaPTOT1J8rguwgsC5cn4="
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
```

### Khi dùng ngrok:

**QUAN TRỌNG:** Khi dùng ngrok, `NEXTAUTH_URL` phải là URL ngrok, không phải localhost!

```env
# Thay "dorie-funnier-lesha.ngrok-free.dev" bằng URL ngrok thực tế của bạn
NEXTAUTH_URL="https://dorie-funnier-lesha.ngrok-free.dev"
GOOGLE_CLIENT_ID="34898162284-g608rr1fnteg6rrf85pqvu2l49q3cft0.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
NEXTAUTH_SECRET="jgg44ygIGk3ozUBWd5npQ86MaPTOT1J8rguwgsC5cn4="
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
```

## Các bước setup

### 1. Tạo file `.env.local`

```bash
cp .env.example .env.local
```

### 2. Cập nhật giá trị trong `.env.local`

- **NEXTAUTH_URL**: 
  - Local: `http://localhost:3000`
  - Ngrok: `https://your-ngrok-url.ngrok-free.dev`

- **GOOGLE_CLIENT_ID** và **GOOGLE_CLIENT_SECRET**: Đã có sẵn

- **NEXTAUTH_SECRET**: Đã có sẵn (`jgg44ygIGk3ozUBWd5npQ86MaPTOT1J8rguwgsC5cn4=`)

- **NEXT_PUBLIC_API_BASE_URL**: 
  - Local: `http://localhost:4000`
  - Production: URL backend thực tế

### 3. Cập nhật Google Cloud Console

Khi dùng ngrok, đảm bảo Google Console có:

**Authorized JavaScript origins:**
```
https://dorie-funnier-lesha.ngrok-free.dev
```

**Authorized redirect URIs:**
```
https://dorie-funnier-lesha.ngrok-free.dev/api/auth/callback/google
```

### 4. Restart server

Sau khi cập nhật `.env.local`:

```bash
# Dừng server hiện tại (Ctrl+C)
# Chạy lại
npm run dev
# hoặc
npm run dev:full
```

## Lưu ý quan trọng

1. **File `.env.local` không được commit vào git** (đã có trong `.gitignore`)

2. **NEXTAUTH_URL phải khớp với domain thực tế:**
   - Nếu truy cập qua `http://localhost:3000` → dùng `http://localhost:3000`
   - Nếu truy cập qua ngrok `https://xxx.ngrok-free.dev` → dùng `https://xxx.ngrok-free.dev`

3. **Khi ngrok URL thay đổi:**
   - Cập nhật `NEXTAUTH_URL` trong `.env.local`
   - Cập nhật Google Console với URL mới
   - Restart Next.js server

4. **NextAuth có thể tự detect URL** từ request headers nếu không set `NEXTAUTH_URL`, nhưng nên set rõ ràng để tránh lỗi.

## Kiểm tra cấu hình

Sau khi setup, test:

1. **Kiểm tra NextAuth route:**
   ```
   http://localhost:3000/api/auth/signin
   ```
   Hoặc với ngrok:
   ```
   https://your-ngrok-url.ngrok-free.dev/api/auth/signin
   ```

2. **Test đăng nhập Google:**
   - Vào `/login`
   - Nhấn "Đăng nhập với Google"
   - Nếu redirect thành công → cấu hình đúng ✅

## Troubleshooting

### Lỗi "redirect_uri_mismatch"
- Kiểm tra Google Console có đúng redirect URI
- Kiểm tra `NEXTAUTH_URL` trong `.env.local` có khớp với domain đang truy cập

### Lỗi "Cannot GET /api/auth/callback/google"
- Đảm bảo ngrok trỏ đến port 3000 (Next.js), không phải port 4000 (Express)
- Kiểm tra Next.js server đang chạy: `npm run dev`

### Lỗi "Missing environment variable"
- Kiểm tra file `.env.local` có tồn tại
- Kiểm tra các biến có đầy đủ không
- Restart server sau khi thêm biến môi trường

