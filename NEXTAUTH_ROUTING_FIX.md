# Sửa lỗi: Request đến Express backend thay vì Next.js

## Vấn đề

Từ log terminal, tôi thấy:
```
GET /api/auth/callback/google?state=...&code=... 404 - 3ms
```

Request đang đến **Express backend** (port 4000) thay vì **Next.js server** (port 3000).

## Nguyên nhân

Ngrok đang trỏ đến port 4000 (Express backend) thay vì port 3000 (Next.js frontend).

## Giải pháp

### Cách 1: Chạy cả 2 server và ngrok trỏ đến Next.js

1. **Chạy cả 2 server:**
   ```bash
   npm run dev:full
   ```
   - Backend Express: `http://localhost:4000`
   - Next.js Frontend: `http://localhost:3000`

2. **Cấu hình ngrok trỏ đến Next.js:**
   ```bash
   ngrok http 3000
   ```
   **KHÔNG phải** `ngrok http 4000`

3. **Cập nhật Google Console:**
   - Lấy URL mới từ ngrok (ví dụ: `https://new-url.ngrok-free.dev`)
   - Cập nhật **Authorized JavaScript origins**: `https://new-url.ngrok-free.dev`
   - Cập nhật **Authorized redirect URIs**: `https://new-url.ngrok-free.dev/api/auth/callback/google`
   - Cập nhật `.env`: `NEXTAUTH_URL="https://new-url.ngrok-free.dev"`

### Cách 2: Chỉ chạy Next.js (nếu backend đã deploy riêng)

1. **Chạy Next.js:**
   ```bash
   npm run dev
   ```

2. **Ngrok trỏ đến Next.js:**
   ```bash
   ngrok http 3000
   ```

3. **Cập nhật `.env` để Next.js biết backend ở đâu:**
   ```env
   NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
   # hoặc nếu backend đã deploy:
   # NEXT_PUBLIC_API_BASE_URL="https://your-backend-url.com"
   ```

## Kiểm tra

1. **Kiểm tra Next.js đang chạy:**
   - Mở: `http://localhost:3000`
   - Nếu thấy trang web → Next.js đang chạy ✅

2. **Kiểm tra ngrok đang trỏ đúng:**
   - Mở URL ngrok (ví dụ: `https://dorie-funnier-lesha.ngrok-free.dev`)
   - Nếu thấy trang Next.js → ngrok đúng ✅
   - Nếu thấy lỗi hoặc không có gì → ngrok đang trỏ sai port

3. **Test route NextAuth:**
   - Mở: `https://your-ngrok-url.ngrok-free.dev/api/auth/signin`
   - Nếu thấy trang đăng nhập NextAuth → route hoạt động ✅
   - Nếu lỗi 404 → ngrok đang trỏ sai port

## Lưu ý quan trọng

- **NextAuth route** (`/api/auth/...`) chỉ có trong **Next.js server** (port 3000)
- **Backend API** (`/api/v1/...`) nằm trong **Express server** (port 4000)
- Ngrok **PHẢI** trỏ đến **Next.js** (port 3000) để NextAuth hoạt động
- Next.js sẽ tự động proxy requests đến backend Express khi cần

## Kiến trúc

```
User Browser
    ↓
Ngrok (port 3000) ← PHẢI trỏ đến đây
    ↓
Next.js Server (port 3000)
    ├── /api/auth/* → NextAuth (xử lý OAuth)
    └── /api/v1/* → Proxy đến Express backend
    ↓
Express Backend (port 4000)
    └── /api/v1/* → API endpoints
```

## Sau khi sửa

1. Restart cả 2 server
2. Restart ngrok với port 3000
3. Cập nhật Google Console với URL ngrok mới
4. Cập nhật `.env` với `NEXTAUTH_URL` mới
5. Test lại đăng nhập Google

