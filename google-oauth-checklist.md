## Thông tin cần cung cấp trước khi tích hợp Google OAuth

1. **Thông tin ứng dụng Google Cloud**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - Tài khoản/Project nào quản lý hai thông số trên để còn truy cập khi cần chỉnh sửa.

2. **Redirect URI đã đăng ký**
   - Đường dẫn callback chính xác (ví dụ: `https://example.com/api/auth/google/callback`).
   - Nếu môi trường dev khác prod, cần nêu rõ từng URL.
   - `NEXTAUTH_URL` tương ứng để NextAuth tạo callback đúng domain.

3. **Chiến lược session/token**
   - Tiếp tục dùng JWT của backend (lưu ở `tpestore_token`) hay chuyển sang session của NextAuth?
   - Nếu vẫn dùng JWT: có muốn tạo endpoint mới (ví dụ `POST /auth/google`) để phát token sau khi NextAuth nhận profile?
   - `NEXTAUTH_SECRET` để mã hóa session của NextAuth (nên dùng chung giữa các môi trường).

4. **Quy ước lưu user**
   - Tên bảng/model chính xác (hiện tại là `User` trong Prisma) và có cần trường bổ sung như `provider`, `providerId` không.
   - Với user Google, cột `password` nên để rỗng, giá trị mặc định hay tạo cột mới?
   - Có cần map avatar URL của Google sang trường cụ thể không.

5. **Phạm vi dữ liệu yêu cầu**
   - Các scope bắt buộc ngoài `openid email profile` (nếu có).

6. **Luồng UI**
   - Trang đăng nhập hiện tại cần redirect về đâu sau khi đăng nhập Google thành công (khách hàng vs admin)?

7. **Hạ tầng triển khai**
   - Domain chính thức (prod) và subdomain môi trường test/staging (nếu cần whitelist callback).
   - Chính sách CORS/CSRF đặc biệt nếu áp dụng.

Khi có đầy đủ thông tin trên, mình sẽ:
1. Cấu hình NextAuth hoặc Passport theo stack hiện tại.
2. Thêm endpoint backend để tạo/ghi nhận user Google nếu cần.
3. Cập nhật UI nút “Đăng nhập bằng Google” và xử lý callback.
4. Viết hướng dẫn kiểm thử (register lần đầu, đăng nhập lại, kiểm tra session/token).

