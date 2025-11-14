# Tóm Tắt Các Lỗi Đã Gặp

## 1. PostgreSQL Null Byte Error (Error Code: 22021)

### Mô tả:
- **Lỗi**: `Invalid prisma.user.update() invocation: Error occurred during query execution: ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "22021", message: "invalid byte sequence for encoding \"UTF8\": 0x00"`

### Nguyên nhân:
- Dữ liệu string chứa ký tự null byte (0x00) không được PostgreSQL chấp nhận
- Có thể do dữ liệu từ frontend hoặc dữ liệu hiện có trong database

### Giải pháp đã áp dụng:
- ✅ Thêm hàm `sanitizeString()` để loại bỏ null bytes và control characters
- ✅ Sanitize tất cả string fields trước khi lưu: `name`, `phone`, `address`, `city`, `gender`
- ✅ Sanitize `birthDate` string trước khi parse thành Date
- ✅ Final sanitization trước khi gửi đến Prisma
- ✅ Double-check null bytes sau sanitization

### File liên quan:
- `backend/src/controllers/user.controller.js` (lines 37-52, 144-175)

---

## 2. Cache Issues (HTTP 304 Not Modified)

### Mô tả:
- **Lỗi**: Backend trả về `304 Not Modified` khiến frontend không nhận được dữ liệu mới sau khi update
- **Triệu chứng**: Dữ liệu đã lưu vào database nhưng UI vẫn hiển thị dữ liệu cũ

### Nguyên nhân:
- Browser cache hoặc server cache headers
- Frontend không force refresh sau khi update

### Giải pháp đã áp dụng:
- ✅ Thêm cache-control headers trong backend:
  - `Cache-Control: no-store, no-cache, must-revalidate, private`
  - `Pragma: no-cache`
  - `Expires: 0`
- ✅ Thêm `forceRefresh` parameter trong `fetchUserProfile()` với cache-busting query string
- ✅ Force refresh sau khi update profile thành công

### File liên quan:
- `backend/src/controllers/user.controller.js` (lines 208-211)
- `src/lib/api.ts` (lines 370-386)
- `src/app/(store)/profile/page.tsx` (lines 936-987)

---

## 3. Frontend Display Issues

### Mô tả:
- **Lỗi**: Dữ liệu đã lưu vào database nhưng không hiển thị trên UI
- **Triệu chứng**: 
  - `phone`, `birthDate`, `gender` đều là `null` trong database
  - UI không hiển thị dữ liệu mới sau khi save

### Nguyên nhân:
- State không được cập nhật đúng cách sau khi refresh
- Parsing dữ liệu từ backend response không đúng
- Xử lý `null`/`undefined` values không đúng trong UI

### Giải pháp đã áp dụng:
- ✅ Cải thiện parsing logic cho `birthDate` (xử lý nhiều format: ISO, YYYY-MM-DD)
- ✅ Cải thiện parsing logic cho `gender` (validate values: 'Nam', 'Nữ', 'Khác')
- ✅ Xử lý `null`/`undefined` values đúng cách trong UI inputs
- ✅ Đồng bộ `profile` và `editedProfile` states
- ✅ Force refresh với cache-busting sau khi save

### File liên quan:
- `src/app/(store)/profile/page.tsx` (lines 142-197, 966-983)

---

## 4. Data Validation Issues

### Mô tả:
- **Lỗi**: Không validate đúng format dữ liệu trước khi lưu
- **Triệu chứng**: 
  - Invalid `birthDate` format có thể gây lỗi
  - Invalid `gender` values có thể gây lỗi

### Giải pháp đã áp dụng:
- ✅ Validate `birthDate` format và convert sang Date object
- ✅ Validate `gender` values: chỉ chấp nhận 'Nam', 'Nữ', 'Khác'
- ✅ Return 400 error với message rõ ràng cho invalid data

### File liên quan:
- `backend/src/controllers/user.controller.js` (lines 107-138)

---

## 5. Error Handling Issues

### Mô tả:
- **Lỗi**: Error messages không rõ ràng, khó debug
- **Triệu chứng**: Frontend chỉ nhận được generic error messages

### Giải pháp đã áp dụng:
- ✅ Thêm extensive logging trong backend và frontend
- ✅ Parse error messages từ backend response
- ✅ Hiển thị error messages rõ ràng trong UI
- ✅ Log chi tiết Prisma errors (code, meta)

### File liên quan:
- `backend/src/controllers/user.controller.js` (lines 213-230)
- `src/lib/api.ts` (lines 388-416)
- `src/app/(store)/profile/page.tsx` (lines 991-1003)

---

## 6. Database Schema Issues

### Mô tả:
- **Lỗi**: Các cột `birthDate` và `gender` không tồn tại trong database
- **Triệu chứng**: Prisma errors về unknown fields

### Giải pháp đã áp dụng:
- ✅ Tạo migration để thêm `birthDate` và `gender` columns
- ✅ Chạy script để đảm bảo columns tồn tại
- ✅ Regenerate Prisma client sau khi update schema

### File liên quan:
- `prisma/schema.prisma`
- `scripts/add-birthdate-gender-columns.js`

---

## Tổng Kết

### Các lỗi đã được fix:
1. ✅ PostgreSQL null byte error - đã thêm sanitization
2. ✅ Cache issues - đã thêm cache-control headers và force refresh
3. ✅ Display issues - đã cải thiện parsing và state management
4. ✅ Validation issues - đã thêm validation cho birthDate và gender
5. ✅ Error handling - đã cải thiện logging và error messages
6. ✅ Database schema - đã đảm bảo columns tồn tại

### Các vấn đề còn lại cần theo dõi:
- ⚠️ Null byte error vẫn có thể xảy ra nếu dữ liệu từ nguồn khác chứa null bytes
- ⚠️ Cần test kỹ với các edge cases (empty strings, special characters, etc.)

### Khuyến nghị:
1. Thêm unit tests cho sanitization function
2. Thêm integration tests cho profile update flow
3. Monitor logs để phát hiện null bytes issues sớm
4. Consider adding input validation middleware

