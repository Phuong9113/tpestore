# PHÂN TÍCH USE CASES - HỆ THỐNG TPE STORE

## 1. DANH SÁCH ACTORS

### 1.1. Customer (Khách hàng)
- **Mô tả**: Người dùng đã đăng ký và đăng nhập vào hệ thống
- **Quyền hạn**:
  - Xem danh sách sản phẩm, chi tiết sản phẩm
  - Quản lý giỏ hàng
  - Đặt hàng và theo dõi đơn hàng
  - Quản lý thông tin cá nhân và địa chỉ
  - Đánh giá sản phẩm
  - So sánh sản phẩm
  - Sử dụng AI chat
  - Xem lịch sử đơn hàng

### 1.2. Guest (Khách vãng lai)
- **Mô tả**: Người dùng chưa đăng nhập
- **Quyền hạn**:
  - Xem danh sách sản phẩm công khai
  - Xem chi tiết sản phẩm
  - Xem đánh giá sản phẩm
  - Đăng ký tài khoản
  - Đăng nhập

### 1.3. Admin (Quản trị viên)
- **Mô tả**: Người quản trị hệ thống với quyền cao nhất
- **Quyền hạn**:
  - Quản lý sản phẩm (CRUD)
  - Quản lý danh mục (CRUD)
  - Quản lý người dùng
  - Quản lý đơn hàng
  - Xem thống kê và báo cáo
  - Import sản phẩm từ Excel
  - Theo dõi đơn hàng GHN
  - Hủy đơn hàng

### 1.4. GHN Shipping System (Hệ thống vận chuyển GHN)
- **Mô tả**: Hệ thống bên ngoài tích hợp để quản lý vận chuyển
- **Quyền hạn**:
  - Cung cấp thông tin tỉnh/thành, quận/huyện, phường/xã
  - Tính phí vận chuyển
  - Tạo đơn vận chuyển
  - Theo dõi trạng thái đơn hàng
  - Hủy đơn vận chuyển

### 1.5. ZaloPay Payment System (Hệ thống thanh toán ZaloPay)
- **Mô tả**: Hệ thống thanh toán trực tuyến
- **Quyền hạn**:
  - Tạo đơn thanh toán
  - Xử lý callback thanh toán
  - Xác minh giao dịch
  - Kiểm tra trạng thái thanh toán

### 1.6. AI Chat Service (Dịch vụ AI Chat)
- **Mô tả**: Hệ thống AI (Gemini) cung cấp tư vấn sản phẩm
- **Quyền hạn**:
  - Xử lý câu hỏi của khách hàng
  - Trả lời tư vấn sản phẩm
  - Hỗ trợ stream response

---

## 2. DANH SÁCH USE CASES THEO ACTOR

### 2.1. USE CASES CHO GUEST

#### UC-G01: Đăng ký tài khoản
- **Mục tiêu**: Tạo tài khoản mới để sử dụng hệ thống
- **Tiền điều kiện**: Chưa có tài khoản, email chưa được sử dụng
- **Hậu điều kiện**: Tài khoản được tạo, người dùng có thể đăng nhập
- **Luồng chính**:
  1. Guest truy cập trang đăng ký
  2. Nhập thông tin: email, password, name (tùy chọn)
  3. Hệ thống kiểm tra email chưa tồn tại
  4. Hệ thống tạo tài khoản với role CUSTOMER
  5. Trả về thông tin tài khoản đã tạo
- **Luồng thay thế**:
  - 3a. Email đã tồn tại → Thông báo lỗi, yêu cầu đăng nhập hoặc dùng email khác
  - 3b. Password không đủ mạnh → Thông báo yêu cầu password mạnh hơn
- **Yêu cầu đặc biệt**: Password phải được hash trước khi lưu

#### UC-G02: Đăng nhập
- **Mục tiêu**: Xác thực và cấp quyền truy cập cho người dùng
- **Tiền điều kiện**: Đã có tài khoản
- **Hậu điều kiện**: Người dùng được cấp JWT token, có thể truy cập các chức năng yêu cầu đăng nhập
- **Luồng chính**:
  1. Guest nhập email và password
  2. Hệ thống xác thực thông tin
  3. Hệ thống tạo JWT token
  4. Trả về token và thông tin người dùng
- **Luồng thay thế**:
  - 2a. Email không tồn tại → Thông báo "Email hoặc mật khẩu không đúng"
  - 2b. Password sai → Thông báo "Email hoặc mật khẩu không đúng"
  - 2c. Tài khoản bị khóa (isActive = false) → Thông báo tài khoản đã bị khóa

#### UC-G03: Xem danh sách sản phẩm
- **Mục tiêu**: Duyệt danh sách tất cả sản phẩm có sẵn
- **Tiền điều kiện**: Không
- **Hậu điều kiện**: Hiển thị danh sách sản phẩm
- **Luồng chính**:
  1. Guest truy cập trang sản phẩm
  2. Hệ thống lấy danh sách sản phẩm từ database
  3. Hiển thị danh sách với thông tin: tên, giá, hình ảnh, danh mục, đánh giá
- **Luồng thay thế**:
  - 2a. Không có sản phẩm → Hiển thị thông báo "Chưa có sản phẩm"

#### UC-G04: Tìm kiếm sản phẩm
- **Mục tiêu**: Tìm sản phẩm theo từ khóa
- **Tiền điều kiện**: Không
- **Hậu điều kiện**: Hiển thị kết quả tìm kiếm
- **Luồng chính**:
  1. Guest nhập từ khóa tìm kiếm
  2. Hệ thống tìm kiếm trong tên và mô tả sản phẩm
  3. Hiển thị kết quả phù hợp
- **Luồng thay thế**:
  - 2a. Không tìm thấy → Hiển thị "Không tìm thấy sản phẩm"

#### UC-G05: Lọc sản phẩm theo danh mục
- **Mục tiêu**: Xem sản phẩm trong một danh mục cụ thể
- **Tiền điều kiện**: Không
- **Hậu điều kiện**: Hiển thị sản phẩm thuộc danh mục được chọn
- **Luồng chính**:
  1. Guest chọn danh mục từ menu
  2. Hệ thống lọc sản phẩm theo categoryId
  3. Hiển thị danh sách sản phẩm đã lọc

#### UC-G06: Xem chi tiết sản phẩm
- **Mục tiêu**: Xem thông tin chi tiết của một sản phẩm
- **Tiền điều kiện**: Không
- **Hậu điều kiện**: Hiển thị thông tin chi tiết sản phẩm
- **Luồng chính**:
  1. Guest click vào sản phẩm
  2. Hệ thống lấy thông tin sản phẩm: tên, mô tả, giá, hình ảnh, thông số kỹ thuật, đánh giá
  3. Hiển thị trang chi tiết sản phẩm
- **Luồng thay thế**:
  - 2a. Sản phẩm không tồn tại → Hiển thị 404

#### UC-G07: Xem đánh giá sản phẩm
- **Mục tiêu**: Xem các đánh giá và bình luận về sản phẩm
- **Tiền điều kiện**: Không
- **Hậu điều kiện**: Hiển thị danh sách đánh giá
- **Luồng chính**:
  1. Guest xem trang chi tiết sản phẩm
  2. Hệ thống lấy danh sách đánh giá (phân trang)
  3. Hiển thị đánh giá với rating, comment, tên người đánh giá, thời gian

---

### 2.2. USE CASES CHO CUSTOMER

#### UC-C01: Cập nhật thông tin cá nhân
- **Mục tiêu**: Cập nhật thông tin profile của người dùng
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Thông tin cá nhân được cập nhật
- **Luồng chính**:
  1. Customer truy cập trang profile
  2. Xem thông tin hiện tại
  3. Chỉnh sửa: name, phone, address, city, birthDate, gender
  4. Lưu thay đổi
  5. Hệ thống cập nhật thông tin
- **Luồng thay thế**:
  - 4a. Dữ liệu không hợp lệ → Hiển thị lỗi validation

#### UC-C02: Xem thông tin cá nhân
- **Mục tiêu**: Xem thông tin profile của mình
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Hiển thị thông tin cá nhân
- **Luồng chính**:
  1. Customer truy cập trang profile
  2. Hệ thống lấy thông tin user từ database
  3. Hiển thị thông tin

#### UC-C03: Quản lý địa chỉ giao hàng - Thêm địa chỉ
- **Mục tiêu**: Thêm địa chỉ giao hàng mới
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Địa chỉ mới được thêm vào danh sách
- **Luồng chính**:
  1. Customer truy cập trang quản lý địa chỉ
  2. Click "Thêm địa chỉ mới"
  3. Nhập thông tin: name, phone, address, province, district, ward, hamlet
  4. Chọn đặt làm địa chỉ mặc định (tùy chọn)
  5. Lưu địa chỉ
  6. Hệ thống tạo địa chỉ mới
- **Luồng thay thế**:
  - 5a. Thiếu thông tin bắt buộc → Hiển thị lỗi
  - 5b. Nếu chọn mặc định, các địa chỉ khác sẽ bỏ mặc định

#### UC-C04: Quản lý địa chỉ giao hàng - Cập nhật địa chỉ
- **Mục tiêu**: Chỉnh sửa thông tin địa chỉ đã có
- **Tiền điều kiện**: Đã đăng nhập, có địa chỉ
- **Hậu điều kiện**: Địa chỉ được cập nhật
- **Luồng chính**:
  1. Customer chọn địa chỉ cần sửa
  2. Chỉnh sửa thông tin
  3. Lưu thay đổi
  4. Hệ thống cập nhật địa chỉ

#### UC-C05: Quản lý địa chỉ giao hàng - Xóa địa chỉ
- **Mục tiêu**: Xóa địa chỉ không còn sử dụng
- **Tiền điều kiện**: Đã đăng nhập, có địa chỉ
- **Hậu điều kiện**: Địa chỉ bị xóa khỏi danh sách
- **Luồng chính**:
  1. Customer chọn địa chỉ cần xóa
  2. Xác nhận xóa
  3. Hệ thống xóa địa chỉ
- **Luồng thay thế**:
  - 2a. Địa chỉ đang được sử dụng trong đơn hàng → Cảnh báo nhưng vẫn cho phép xóa

#### UC-C06: Quản lý địa chỉ giao hàng - Đặt địa chỉ mặc định
- **Mục tiêu**: Đặt một địa chỉ làm mặc định
- **Tiền điều kiện**: Đã đăng nhập, có địa chỉ
- **Hậu điều kiện**: Địa chỉ được đặt làm mặc định, các địa chỉ khác bỏ mặc định
- **Luồng chính**:
  1. Customer chọn địa chỉ
  2. Click "Đặt làm mặc định"
  3. Hệ thống cập nhật isDefault = true cho địa chỉ này, false cho các địa chỉ khác

#### UC-C07: Thêm sản phẩm vào giỏ hàng
- **Mục tiêu**: Thêm sản phẩm vào giỏ hàng để mua sau
- **Tiền điều kiện**: Đã đăng nhập, sản phẩm còn hàng
- **Hậu điều kiện**: Sản phẩm được thêm vào giỏ hàng
- **Luồng chính**:
  1. Customer xem chi tiết sản phẩm
  2. Chọn số lượng
  3. Click "Thêm vào giỏ hàng"
  4. Hệ thống kiểm tra stock
  5. Nếu sản phẩm đã có trong giỏ, cộng dồn số lượng
  6. Nếu chưa có, tạo CartItem mới
  7. Cập nhật ProductInteraction (addedToCart = true)
- **Luồng thay thế**:
  - 4a. Hết hàng → Thông báo "Sản phẩm đã hết hàng"
  - 4b. Số lượng vượt quá stock → Thông báo số lượng tối đa có thể mua
  - 5a. Tổng số lượng sau khi cộng dồn vượt stock → Điều chỉnh về stock tối đa

#### UC-C08: Xem giỏ hàng
- **Mục tiêu**: Xem danh sách sản phẩm trong giỏ hàng
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Hiển thị giỏ hàng với tổng tiền
- **Luồng chính**:
  1. Customer truy cập trang giỏ hàng
  2. Hệ thống lấy tất cả CartItem của user
  3. Tính tổng tiền
  4. Hiển thị danh sách với hình ảnh, tên, giá, số lượng, tổng tiền từng sản phẩm

#### UC-C09: Cập nhật số lượng sản phẩm trong giỏ hàng
- **Mục tiêu**: Thay đổi số lượng sản phẩm trong giỏ hàng
- **Tiền điều kiện**: Đã đăng nhập, có sản phẩm trong giỏ
- **Hậu điều kiện**: Số lượng được cập nhật
- **Luồng chính**:
  1. Customer chọn sản phẩm trong giỏ
  2. Thay đổi số lượng
  3. Hệ thống kiểm tra stock
  4. Cập nhật quantity trong CartItem
- **Luồng thay thế**:
  - 3a. Số lượng vượt stock → Điều chỉnh về stock tối đa và thông báo
  - 3b. Số lượng = 0 → Xóa khỏi giỏ hàng (hoặc chuyển sang UC-C10)

#### UC-C10: Xóa sản phẩm khỏi giỏ hàng
- **Mục tiêu**: Loại bỏ sản phẩm khỏi giỏ hàng
- **Tiền điều kiện**: Đã đăng nhập, có sản phẩm trong giỏ
- **Hậu điều kiện**: Sản phẩm bị xóa khỏi giỏ hàng
- **Luồng chính**:
  1. Customer chọn sản phẩm trong giỏ
  2. Click "Xóa"
  3. Xác nhận xóa
  4. Hệ thống xóa CartItem

#### UC-C11: Xóa toàn bộ giỏ hàng
- **Mục tiêu**: Xóa tất cả sản phẩm trong giỏ hàng
- **Tiền điều kiện**: Đã đăng nhập, có sản phẩm trong giỏ
- **Hậu điều kiện**: Giỏ hàng trống
- **Luồng chính**:
  1. Customer click "Xóa tất cả"
  2. Xác nhận
  3. Hệ thống xóa tất cả CartItem của user

#### UC-C12: Tạo đơn hàng
- **Mục tiêu**: Đặt hàng các sản phẩm trong giỏ hàng
- **Tiền điều kiện**: Đã đăng nhập, có sản phẩm trong giỏ, có địa chỉ giao hàng
- **Hậu điều kiện**: Đơn hàng được tạo, giỏ hàng được xóa, stock được cập nhật
- **Luồng chính**:
  1. Customer vào trang checkout
  2. Chọn địa chỉ giao hàng (hoặc nhập mới)
  3. Chọn phương thức thanh toán (COD hoặc ZaloPay)
  4. Hệ thống tính phí vận chuyển (GHN)
  5. Xem tổng tiền (sản phẩm + phí vận chuyển)
  6. Xác nhận đặt hàng
  7. Hệ thống kiểm tra stock lại
  8. Tạo Order với status = PENDING, paymentStatus = PENDING
  9. Tạo OrderItem cho mỗi sản phẩm
  10. Cập nhật stock (trừ số lượng đã đặt)
  11. Xóa giỏ hàng
  12. Cập nhật ProductInteraction (purchased = true)
  13. Nếu ZaloPay: Tạo đơn thanh toán ZaloPay
  14. Nếu COD: Đơn hàng sẵn sàng để xử lý
- **Luồng thay thế**:
  - 7a. Một sản phẩm hết hàng → Thông báo và không tạo đơn
  - 7b. Số lượng vượt stock → Điều chỉnh số lượng hoặc từ chối
  - 13a. ZaloPay tạo đơn thất bại → Hủy đơn hàng, hoàn lại stock
  - 13b. Thanh toán ZaloPay thành công → Cập nhật paymentStatus = PAID

#### UC-C13: Xem danh sách đơn hàng
- **Mục tiêu**: Xem tất cả đơn hàng của mình
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Hiển thị danh sách đơn hàng
- **Luồng chính**:
  1. Customer truy cập trang "Đơn hàng của tôi"
  2. Hệ thống lấy tất cả Order của user
  3. Hiển thị danh sách với: mã đơn, ngày đặt, tổng tiền, trạng thái, phương thức thanh toán

#### UC-C14: Xem chi tiết đơn hàng
- **Mục tiêu**: Xem thông tin chi tiết của một đơn hàng
- **Tiền điều kiện**: Đã đăng nhập, đơn hàng thuộc về user
- **Hậu điều kiện**: Hiển thị chi tiết đơn hàng
- **Luồng chính**:
  1. Customer chọn đơn hàng
  2. Hệ thống lấy thông tin Order, OrderItem, Product
  3. Hiển thị: thông tin đơn hàng, danh sách sản phẩm, địa chỉ giao hàng, trạng thái, mã GHN (nếu có)

#### UC-C15: Theo dõi đơn hàng
- **Mục tiêu**: Xem trạng thái vận chuyển của đơn hàng
- **Tiền điều kiện**: Đã đăng nhập, đơn hàng có ghnOrderCode
- **Hậu điều kiện**: Hiển thị trạng thái vận chuyển
- **Luồng chính**:
  1. Customer chọn đơn hàng
  2. Click "Theo dõi đơn hàng"
  3. Hệ thống gọi GHN API để lấy thông tin tracking
  4. Hiển thị lịch sử vận chuyển với thời gian và trạng thái

#### UC-C16: Hủy đơn hàng
- **Mục tiêu**: Hủy đơn hàng chưa được xử lý
- **Tiền điều kiện**: Đã đăng nhập, đơn hàng có status = PENDING hoặc PROCESSING
- **Hậu điều kiện**: Đơn hàng bị hủy, stock được hoàn lại, nếu đã thanh toán thì hoàn tiền
- **Luồng chính**:
  1. Customer chọn đơn hàng
  2. Click "Hủy đơn hàng"
  3. Nhập lý do hủy (tùy chọn)
  4. Xác nhận hủy
  5. Hệ thống kiểm tra trạng thái đơn hàng
  6. Cập nhật status = CANCELLED
  7. Hoàn lại stock cho các sản phẩm
  8. Nếu đã có ghnOrderCode: Hủy đơn vận chuyển trên GHN
  9. Nếu đã thanh toán: Xử lý hoàn tiền (nếu cần)
- **Luồng thay thế**:
  - 5a. Đơn hàng đã SHIPPING hoặc COMPLETED → Không cho phép hủy, thông báo lỗi
  - 8a. Hủy đơn GHN thất bại → Ghi log lỗi nhưng vẫn hủy đơn trong hệ thống

#### UC-C17: Đánh giá sản phẩm
- **Mục tiêu**: Viết đánh giá cho sản phẩm đã mua
- **Tiền điều kiện**: Đã đăng nhập, đã mua sản phẩm (có OrderItem trong Order COMPLETED)
- **Hậu điều kiện**: Đánh giá được tạo và hiển thị trên trang sản phẩm
- **Luồng chính**:
  1. Customer vào trang chi tiết sản phẩm đã mua
  2. Click "Viết đánh giá"
  3. Chọn rating (1-5 sao)
  4. Nhập comment
  5. Chọn orderId (nếu có nhiều đơn chứa sản phẩm này)
  6. Gửi đánh giá
  7. Hệ thống kiểm tra điều kiện (đã mua, chưa đánh giá cho order này)
  8. Tạo Review
- **Luồng thay thế**:
  - 7a. Chưa mua sản phẩm → Thông báo "Bạn cần mua sản phẩm để đánh giá"
  - 7b. Đã đánh giá cho order này → Thông báo "Bạn đã đánh giá sản phẩm này"

#### UC-C18: Xem đánh giá của mình
- **Mục tiêu**: Xem các đánh giá đã viết
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Hiển thị danh sách đánh giá
- **Luồng chính**:
  1. Customer vào trang profile
  2. Chọn "Đánh giá của tôi"
  3. Hệ thống lấy tất cả Review của user
  4. Hiển thị danh sách với sản phẩm, rating, comment, thời gian

#### UC-C19: Tương tác với sản phẩm (View/Like)
- **Mục tiêu**: Ghi nhận hành vi người dùng để đề xuất sản phẩm
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: ProductInteraction được cập nhật
- **Luồng chính**:
  1. Customer xem sản phẩm (action = "view")
  2. Hệ thống cập nhật ProductInteraction với viewedAt = now
  3. Hoặc Customer like sản phẩm (action = "like")
  4. Hệ thống cập nhật ProductInteraction với liked = true

#### UC-C20: Xem gợi ý sản phẩm
- **Mục tiêu**: Xem sản phẩm được đề xuất dựa trên lịch sử tương tác
- **Tiền điều kiện**: Đã đăng nhập, có lịch sử tương tác
- **Hậu điều kiện**: Hiển thị danh sách sản phẩm gợi ý
- **Luồng chính**:
  1. Customer truy cập trang "Gợi ý cho bạn"
  2. Hệ thống phân tích ProductInteraction của user
  3. Đề xuất sản phẩm dựa trên: danh mục đã xem, sản phẩm đã like, sản phẩm đã mua
  4. Hiển thị danh sách sản phẩm gợi ý

#### UC-C21: So sánh sản phẩm
- **Mục tiêu**: So sánh nhiều sản phẩm với nhau
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Hiển thị bảng so sánh
- **Luồng chính**:
  1. Customer xem danh sách sản phẩm
  2. Click "So sánh" trên các sản phẩm muốn so sánh (tối đa 3-4 sản phẩm)
  3. Sản phẩm được thêm vào ComparisonContext
  4. Click "Xem so sánh"
  5. Hiển thị modal so sánh với: giá, thông số kỹ thuật, đánh giá, hình ảnh
- **Luồng thay thế**:
  - 2a. Đã chọn quá số lượng tối đa → Thông báo và yêu cầu bỏ bớt

#### UC-C22: Sử dụng AI Chat
- **Mục tiêu**: Nhận tư vấn về sản phẩm từ AI
- **Tiền điều kiện**: Đã đăng nhập (hoặc không, tùy implementation)
- **Hậu điều kiện**: Nhận được câu trả lời từ AI
- **Luồng chính**:
  1. Customer mở chat box
  2. Nhập câu hỏi về sản phẩm
  3. Hệ thống gửi request đến AI service (Gemini)
  4. AI xử lý và trả về câu trả lời
  5. Hiển thị câu trả lời trong chat
- **Luồng thay thế**:
  - 3a. AI service lỗi → Thông báo "Xin lỗi, tôi không thể trả lời ngay bây giờ"
  - 4a. Response stream → Hiển thị từng phần khi nhận được

#### UC-C23: Kiểm tra trạng thái đã mua sản phẩm
- **Mục tiêu**: Kiểm tra xem đã mua sản phẩm này chưa (để hiển thị nút đánh giá)
- **Tiền điều kiện**: Đã đăng nhập
- **Hậu điều kiện**: Trả về thông tin đã mua hay chưa
- **Luồng chính**:
  1. Customer xem chi tiết sản phẩm
  2. Hệ thống kiểm tra xem có OrderItem nào của user chứa sản phẩm này trong Order COMPLETED không
  3. Trả về kết quả: đã mua hay chưa, orderId (nếu có)

---

### 2.3. USE CASES CHO ADMIN

#### UC-A01: Quản lý sản phẩm - Xem danh sách sản phẩm
- **Mục tiêu**: Xem tất cả sản phẩm trong hệ thống
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị danh sách sản phẩm với đầy đủ thông tin
- **Luồng chính**:
  1. Admin truy cập trang quản lý sản phẩm
  2. Hệ thống lấy tất cả Product với thông tin category
  3. Hiển thị bảng với: tên, giá, stock, danh mục, hình ảnh, ngày tạo

#### UC-A02: Quản lý sản phẩm - Xem chi tiết sản phẩm
- **Mục tiêu**: Xem thông tin chi tiết của một sản phẩm
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị chi tiết sản phẩm
- **Luồng chính**:
  1. Admin chọn sản phẩm
  2. Hệ thống lấy thông tin Product, Category, SpecValue
  3. Hiển thị đầy đủ thông tin

#### UC-A03: Quản lý sản phẩm - Tạo sản phẩm mới
- **Mục tiêu**: Thêm sản phẩm mới vào hệ thống
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, có danh mục
- **Hậu điều kiện**: Sản phẩm mới được tạo
- **Luồng chính**:
  1. Admin click "Thêm sản phẩm mới"
  2. Nhập thông tin: name, description, price, stock, image, categoryId
  3. Nhập thông số kỹ thuật (SpecValue) cho các SpecField của category
  4. Lưu sản phẩm
  5. Hệ thống tạo Product và các SpecValue
- **Luồng thay thế**:
  - 4a. Dữ liệu không hợp lệ → Hiển thị lỗi validation
  - 4b. Category không tồn tại → Thông báo lỗi

#### UC-A04: Quản lý sản phẩm - Cập nhật sản phẩm
- **Mục tiêu**: Chỉnh sửa thông tin sản phẩm
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, sản phẩm tồn tại
- **Hậu điều kiện**: Sản phẩm được cập nhật
- **Luồng chính**:
  1. Admin chọn sản phẩm cần sửa
  2. Chỉnh sửa thông tin
  3. Lưu thay đổi
  4. Hệ thống cập nhật Product và SpecValue
- **Luồng thay thế**:
  - 3a. Giảm stock xuống dưới số lượng đã đặt trong Order PENDING → Cảnh báo

#### UC-A05: Quản lý sản phẩm - Xóa sản phẩm
- **Mục tiêu**: Xóa sản phẩm khỏi hệ thống
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, sản phẩm tồn tại
- **Hậu điều kiện**: Sản phẩm bị xóa
- **Luồng chính**:
  1. Admin chọn sản phẩm cần xóa
  2. Xác nhận xóa
  3. Hệ thống kiểm tra ràng buộc (OrderItem, CartItem, Review)
  4. Xóa Product (cascade xóa SpecValue, CartItem)
- **Luồng thay thế**:
  - 3a. Sản phẩm đang có trong đơn hàng → Cảnh báo nhưng vẫn cho phép xóa (hoặc soft delete)

#### UC-A06: Import sản phẩm từ Excel
- **Mục tiêu**: Thêm nhiều sản phẩm cùng lúc từ file Excel
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, có file Excel template
- **Hậu điều kiện**: Sản phẩm được import vào hệ thống
- **Luồng chính**:
  1. Admin tải template Excel cho category
  2. Điền thông tin sản phẩm vào template
  3. Upload file Excel
  4. Hệ thống đọc và validate dữ liệu
  5. Tạo Product và SpecValue cho mỗi dòng hợp lệ
  6. Trả về kết quả: số lượng thành công, số lượng lỗi
- **Luồng thay thế**:
  - 4a. File không đúng format → Thông báo lỗi
  - 4b. Dữ liệu không hợp lệ → Báo cáo dòng lỗi và lý do
  - 5a. Một số sản phẩm import thành công, một số thất bại → Trả về danh sách lỗi

#### UC-A07: Tải template Excel
- **Mục tiêu**: Tải file template để import sản phẩm
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: File template được tải về
- **Luồng chính**:
  1. Admin chọn category
  2. Click "Tải template"
  3. Hệ thống tạo file Excel với các cột: name, description, price, stock, image, và các SpecField của category
  4. Trả về file để download

#### UC-A08: Quản lý danh mục - Xem danh sách danh mục
- **Mục tiêu**: Xem tất cả danh mục sản phẩm
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị danh sách danh mục
- **Luồng chính**:
  1. Admin truy cập trang quản lý danh mục
  2. Hệ thống lấy tất cả Category
  3. Hiển thị danh sách với: tên, mô tả, hình ảnh, số lượng sản phẩm

#### UC-A09: Quản lý danh mục - Xem chi tiết danh mục
- **Mục tiêu**: Xem thông tin chi tiết của một danh mục
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị chi tiết danh mục
- **Luồng chính**:
  1. Admin chọn danh mục
  2. Hệ thống lấy thông tin Category và SpecField
  3. Hiển thị thông tin danh mục và các trường thông số kỹ thuật

#### UC-A10: Quản lý danh mục - Tạo danh mục mới
- **Mục tiêu**: Thêm danh mục mới
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Danh mục mới được tạo
- **Luồng chính**:
  1. Admin click "Thêm danh mục mới"
  2. Nhập thông tin: name, description, image
  3. Thêm các SpecField (tùy chọn): name, type, required, unit
  4. Lưu danh mục
  5. Hệ thống tạo Category và SpecField
- **Luồng thay thế**:
  - 4a. Tên danh mục trùng → Thông báo lỗi

#### UC-A11: Quản lý danh mục - Cập nhật danh mục
- **Mục tiêu**: Chỉnh sửa thông tin danh mục
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, danh mục tồn tại
- **Hậu điều kiện**: Danh mục được cập nhật
- **Luồng chính**:
  1. Admin chọn danh mục cần sửa
  2. Chỉnh sửa thông tin
  3. Thêm/sửa/xóa SpecField
  4. Lưu thay đổi
  5. Hệ thống cập nhật Category và SpecField
- **Luồng thay thế**:
  - 3a. Xóa SpecField đang được sử dụng trong Product → Cảnh báo, xóa cascade SpecValue

#### UC-A12: Quản lý danh mục - Xóa danh mục
- **Mục tiêu**: Xóa danh mục khỏi hệ thống
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, danh mục tồn tại
- **Hậu điều kiện**: Danh mục bị xóa
- **Luồng chính**:
  1. Admin chọn danh mục cần xóa
  2. Xác nhận xóa
  3. Hệ thống kiểm tra ràng buộc (Product)
  4. Xóa Category (cascade xóa SpecField, Product)
- **Luồng thay thế**:
  - 3a. Danh mục đang có sản phẩm → Cảnh báo, yêu cầu xác nhận lại

#### UC-A13: Quản lý người dùng - Xem danh sách người dùng
- **Mục tiêu**: Xem tất cả người dùng trong hệ thống
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị danh sách người dùng
- **Luồng chính**:
  1. Admin truy cập trang quản lý người dùng
  2. Hệ thống lấy tất cả User
  3. Hiển thị bảng với: tên, email, phone, role, trạng thái, ngày tạo

#### UC-A14: Quản lý người dùng - Xem chi tiết người dùng
- **Mục tiêu**: Xem thông tin chi tiết của một người dùng
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị chi tiết người dùng
- **Luồng chính**:
  1. Admin chọn người dùng
  2. Hệ thống lấy thông tin User, Order, Review
  3. Hiển thị đầy đủ thông tin và thống kê

#### UC-A15: Quản lý người dùng - Cập nhật người dùng
- **Mục tiêu**: Chỉnh sửa thông tin người dùng
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, người dùng tồn tại
- **Hậu điều kiện**: Thông tin người dùng được cập nhật
- **Luồng chính**:
  1. Admin chọn người dùng cần sửa
  2. Chỉnh sửa thông tin: name, phone, address, city, role, isActive
  3. Lưu thay đổi
  4. Hệ thống cập nhật User
- **Luồng thay thế**:
  - 3a. Email trùng với người dùng khác → Thông báo lỗi (email không được sửa)

#### UC-A16: Quản lý người dùng - Xóa người dùng
- **Mục tiêu**: Xóa người dùng khỏi hệ thống
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, người dùng tồn tại
- **Hậu điều kiện**: Người dùng bị xóa
- **Luồng chính**:
  1. Admin chọn người dùng cần xóa
  2. Xác nhận xóa
  3. Hệ thống kiểm tra ràng buộc (Order, Review)
  4. Xóa User (cascade xóa CartItem, Address, ProductInteraction)
- **Luồng thay thế**:
  - 3a. Người dùng có đơn hàng → Cảnh báo, có thể soft delete (isActive = false) thay vì xóa

#### UC-A17: Xem thống kê người dùng
- **Mục tiêu**: Xem các số liệu thống kê về người dùng
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị thống kê
- **Luồng chính**:
  1. Admin truy cập trang thống kê người dùng
  2. Hệ thống tính toán: tổng số người dùng, số người dùng mới trong tháng, số người dùng active
  3. Hiển thị biểu đồ và số liệu

#### UC-A18: Quản lý đơn hàng - Xem danh sách đơn hàng
- **Mục tiêu**: Xem tất cả đơn hàng trong hệ thống
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị danh sách đơn hàng
- **Luồng chính**:
  1. Admin truy cập trang quản lý đơn hàng
  2. Hệ thống lấy tất cả Order với thông tin User
  3. Hiển thị bảng với: mã đơn, khách hàng, tổng tiền, trạng thái, ngày đặt, phương thức thanh toán

#### UC-A19: Quản lý đơn hàng - Xem chi tiết đơn hàng
- **Mục tiêu**: Xem thông tin chi tiết của một đơn hàng
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị chi tiết đơn hàng
- **Luồng chính**:
  1. Admin chọn đơn hàng
  2. Hệ thống lấy thông tin Order, OrderItem, Product, User
  3. Hiển thị đầy đủ thông tin: sản phẩm, địa chỉ giao hàng, trạng thái, mã GHN

#### UC-A20: Quản lý đơn hàng - Cập nhật trạng thái đơn hàng
- **Mục tiêu**: Thay đổi trạng thái đơn hàng (PENDING → PROCESSING → SHIPPING → COMPLETED)
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, đơn hàng tồn tại
- **Hậu điều kiện**: Trạng thái đơn hàng được cập nhật
- **Luồng chính**:
  1. Admin chọn đơn hàng
  2. Chọn trạng thái mới
  3. Lưu thay đổi
  4. Hệ thống cập nhật Order.status
  5. Nếu chuyển sang SHIPPING và chưa có ghnOrderCode: Tạo đơn vận chuyển GHN
- **Luồng thay thế**:
  - 4a. Chuyển từ COMPLETED về trạng thái trước → Cảnh báo
  - 5a. Tạo đơn GHN thất bại → Ghi log lỗi, giữ trạng thái hiện tại

#### UC-A21: Quản lý đơn hàng - Hủy đơn hàng
- **Mục tiêu**: Hủy đơn hàng (thường do khách hàng yêu cầu hoặc lỗi)
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, đơn hàng chưa COMPLETED
- **Hậu điều kiện**: Đơn hàng bị hủy, stock được hoàn lại
- **Luồng chính**:
  1. Admin chọn đơn hàng
  2. Click "Hủy đơn hàng"
  3. Nhập lý do hủy
  4. Xác nhận
  5. Hệ thống cập nhật status = CANCELLED
  6. Hoàn lại stock
  7. Nếu có ghnOrderCode: Hủy đơn vận chuyển trên GHN
  8. Nếu đã thanh toán: Xử lý hoàn tiền

#### UC-A22: Xem thống kê đơn hàng
- **Mục tiêu**: Xem các số liệu thống kê về đơn hàng
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị thống kê
- **Luồng chính**:
  1. Admin truy cập trang thống kê đơn hàng
  2. Hệ thống tính toán: tổng số đơn, đơn mới, đơn đang xử lý, đơn đã hoàn thành, đơn đã hủy
  3. Hiển thị biểu đồ và số liệu

#### UC-A23: Xem thống kê doanh thu
- **Mục tiêu**: Xem thống kê doanh thu theo thời gian
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị thống kê doanh thu
- **Luồng chính**:
  1. Admin truy cập trang thống kê doanh thu
  2. Chọn khoảng thời gian (ngày, tuần, tháng, năm)
  3. Hệ thống tính toán: tổng doanh thu, doanh thu theo ngày, doanh thu theo tháng
  4. Hiển thị biểu đồ và bảng số liệu

#### UC-A24: Xem thống kê dashboard
- **Mục tiêu**: Xem tổng quan tình hình kinh doanh
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị dashboard
- **Luồng chính**:
  1. Admin truy cập trang dashboard
  2. Hệ thống tính toán các chỉ số: tổng doanh thu, số đơn hàng, số khách hàng, số sản phẩm, top sản phẩm bán chạy
  3. Hiển thị các widget và biểu đồ

#### UC-A25: Xem doanh thu theo danh mục
- **Mục tiêu**: Phân tích doanh thu theo từng danh mục sản phẩm
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị doanh thu theo danh mục
- **Luồng chính**:
  1. Admin truy cập trang phân tích doanh thu
  2. Hệ thống tính toán doanh thu cho mỗi Category
  3. Hiển thị biểu đồ cột hoặc tròn

#### UC-A26: Xem top sản phẩm bán chạy
- **Mục tiêu**: Xem các sản phẩm bán chạy nhất
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị danh sách top sản phẩm
- **Luồng chính**:
  1. Admin truy cập trang phân tích sản phẩm
  2. Chọn số lượng top (10, 20, 50)
  3. Hệ thống tính toán số lượng bán ra cho mỗi Product
  4. Sắp xếp theo số lượng giảm dần
  5. Hiển thị danh sách với: tên sản phẩm, số lượng bán, doanh thu

#### UC-A27: Xem doanh số theo khu vực
- **Mục tiêu**: Phân tích doanh số theo địa lý
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hiển thị doanh số theo khu vực
- **Luồng chính**:
  1. Admin truy cập trang phân tích địa lý
  2. Hệ thống tính toán doanh số theo shippingProvince
  3. Hiển thị bản đồ hoặc bảng với tỉnh/thành và doanh số

#### UC-A28: Xem chi tiết đơn hàng GHN
- **Mục tiêu**: Xem thông tin chi tiết đơn hàng trên hệ thống GHN
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN, đơn hàng có ghnOrderCode
- **Hậu điều kiện**: Hiển thị thông tin từ GHN
- **Luồng chính**:
  1. Admin chọn đơn hàng có ghnOrderCode
  2. Click "Xem chi tiết GHN"
  3. Hệ thống gọi GHN API để lấy thông tin đơn hàng
  4. Hiển thị: trạng thái, lịch sử vận chuyển, thông tin người nhận, phí vận chuyển

#### UC-A29: Upload hình ảnh
- **Mục tiêu**: Upload hình ảnh cho sản phẩm hoặc danh mục
- **Tiền điều kiện**: Đã đăng nhập với role ADMIN
- **Hậu điều kiện**: Hình ảnh được lưu và trả về URL
- **Luồng chính**:
  1. Admin chọn file hình ảnh
  2. Upload file
  3. Hệ thống lưu file vào public/uploads
  4. Trả về URL để sử dụng
- **Luồng thay thế**:
  - 2a. File không phải hình ảnh → Thông báo lỗi
  - 2b. File quá lớn → Thông báo lỗi

---

### 2.4. USE CASES CHO HỆ THỐNG GHN

#### UC-GHN01: Lấy danh sách tỉnh/thành
- **Mục tiêu**: Cung cấp danh sách tỉnh/thành phố
- **Tiền điều kiện**: Không
- **Hậu điều kiện**: Trả về danh sách tỉnh/thành
- **Luồng chính**:
  1. Hệ thống gọi GHN API /provinces
  2. GHN trả về danh sách tỉnh/thành
  3. Hiển thị cho người dùng

#### UC-GHN02: Lấy danh sách quận/huyện
- **Mục tiêu**: Cung cấp danh sách quận/huyện theo tỉnh/thành
- **Tiền điều kiện**: Đã chọn tỉnh/thành
- **Hậu điều kiện**: Trả về danh sách quận/huyện
- **Luồng chính**:
  1. Hệ thống gọi GHN API /districts với provinceId
  2. GHN trả về danh sách quận/huyện
  3. Hiển thị cho người dùng

#### UC-GHN03: Lấy danh sách phường/xã
- **Mục tiêu**: Cung cấp danh sách phường/xã theo quận/huyện
- **Tiền điều kiện**: Đã chọn quận/huyện
- **Hậu điều kiện**: Trả về danh sách phường/xã
- **Luồng chính**:
  1. Hệ thống gọi GHN API /wards với districtId
  2. GHN trả về danh sách phường/xã
  3. Hiển thị cho người dùng

#### UC-GHN04: Tính phí vận chuyển
- **Mục tiêu**: Tính toán phí vận chuyển dựa trên địa chỉ và dịch vụ
- **Tiền điều kiện**: Có thông tin địa chỉ gửi và nhận
- **Hậu điều kiện**: Trả về phí vận chuyển và thời gian dự kiến
- **Luồng chính**:
  1. Hệ thống gọi GHN API /fee với thông tin: fromDistrictId, toDistrictId, toWardCode, weight, serviceId
  2. GHN tính toán và trả về: total, service_fee, insurance_fee, time
  3. Hiển thị phí vận chuyển cho người dùng
- **Luồng thay thế**:
  - 2a. GHN API lỗi → Trả về phí mặc định 50,000 VNĐ

#### UC-GHN05: Lấy danh sách dịch vụ vận chuyển
- **Mục tiêu**: Lấy danh sách dịch vụ vận chuyển có sẵn
- **Tiền điều kiện**: Có fromDistrictId và toDistrictId
- **Hậu điều kiện**: Trả về danh sách dịch vụ
- **Luồng chính**:
  1. Hệ thống gọi GHN API /services với fromDistrictId và toDistrictId
  2. GHN trả về danh sách dịch vụ
  3. Hiển thị cho người dùng chọn

#### UC-GHN06: Tạo đơn vận chuyển
- **Mục tiêu**: Tạo đơn hàng vận chuyển trên GHN
- **Tiền điều kiện**: Có Order trong hệ thống, có đầy đủ thông tin địa chỉ
- **Hậu điều kiện**: Đơn vận chuyển được tạo, Order được cập nhật với ghnOrderCode
- **Luồng chính**:
  1. Hệ thống gọi GHN API /order với thông tin: toName, toPhone, toAddress, toWardCode, toDistrictId, toProvinceId, items, paymentTypeId
  2. GHN tạo đơn và trả về order_code
  3. Hệ thống cập nhật Order với ghnOrderCode và status = PROCESSING
  4. Gửi email thông báo cho khách hàng
- **Luồng thay thế**:
  - 2a. GHN API lỗi → Ghi log lỗi, không cập nhật Order
  - 2b. Thiếu thông tin địa chỉ → Thông báo lỗi validation

#### UC-GHN07: Theo dõi đơn hàng
- **Mục tiêu**: Lấy thông tin trạng thái vận chuyển từ GHN
- **Tiền điều kiện**: Có ghnOrderCode
- **Hậu điều kiện**: Trả về thông tin tracking
- **Luồng chính**:
  1. Hệ thống gọi GHN API /track với orderCode
  2. GHN trả về thông tin: status, log (lịch sử vận chuyển)
  3. Hiển thị trạng thái và lịch sử cho người dùng

#### UC-GHN08: Hủy đơn vận chuyển
- **Mục tiêu**: Hủy đơn hàng vận chuyển trên GHN
- **Tiền điều kiện**: Có ghnOrderCode, đơn chưa được giao
- **Hậu điều kiện**: Đơn vận chuyển bị hủy trên GHN
- **Luồng chính**:
  1. Hệ thống gọi GHN API /cancel với orderCode và reason
  2. GHN xử lý hủy đơn
  3. Trả về kết quả

---

### 2.5. USE CASES CHO HỆ THỐNG ZALOPAY

#### UC-ZP01: Tạo đơn thanh toán ZaloPay
- **Mục tiêu**: Tạo đơn thanh toán trên ZaloPay
- **Tiền điều kiện**: Đã đăng nhập, có Order với paymentMethod = ZALOPAY
- **Hậu điều kiện**: Đơn thanh toán được tạo, trả về payment_url
- **Luồng chính**:
  1. Customer chọn thanh toán ZaloPay khi đặt hàng
  2. Hệ thống tạo Order với paymentMethod = ZALOPAY
  3. Gọi ZaloPay API để tạo đơn thanh toán với: amount, orderId, description
  4. ZaloPay trả về payment_url và zp_trans_id
  5. Lưu transactionId vào Order
  6. Redirect customer đến payment_url
- **Luồng thay thế**:
  - 3a. ZaloPay API lỗi → Thông báo lỗi, cho phép chọn phương thức khác
  - 3b. Số tiền không hợp lệ → Thông báo lỗi

#### UC-ZP02: Xử lý callback thanh toán
- **Mục tiêu**: Nhận thông báo từ ZaloPay khi thanh toán hoàn tất
- **Tiền điều kiện**: Có đơn thanh toán ZaloPay
- **Hậu điều kiện**: Order được cập nhật paymentStatus
- **Luồng chính**:
  1. ZaloPay gửi callback đến hệ thống
  2. Hệ thống xác minh chữ ký từ ZaloPay
  3. Kiểm tra trạng thái thanh toán (thành công/thất bại)
  4. Cập nhật Order: paymentStatus = PAID (nếu thành công), paidAt = now
  5. Trả về response cho ZaloPay
- **Luồng thay thế**:
  - 2a. Chữ ký không hợp lệ → Từ chối callback
  - 3a. Thanh toán thất bại → Cập nhật paymentStatus = PENDING, ghi log

#### UC-ZP03: Xác minh thanh toán
- **Mục tiêu**: Xác minh trạng thái thanh toán từ ZaloPay
- **Tiền điều kiện**: Có Order với transactionId
- **Hậu điều kiện**: Trả về trạng thái thanh toán
- **Luồng chính**:
  1. Hệ thống gọi ZaloPay API để kiểm tra trạng thái
  2. ZaloPay trả về trạng thái
  3. Cập nhật Order nếu cần
  4. Trả về trạng thái cho người dùng

#### UC-ZP04: Kiểm tra trạng thái thanh toán
- **Mục tiêu**: Kiểm tra trạng thái thanh toán của một đơn hàng
- **Tiền điều kiện**: Đã đăng nhập, có Order với paymentMethod = ZALOPAY
- **Hậu điều kiện**: Trả về trạng thái thanh toán
- **Luồng chính**:
  1. Customer hoặc Admin yêu cầu kiểm tra trạng thái
  2. Hệ thống gọi ZaloPay API với transactionId
  3. ZaloPay trả về trạng thái
  4. Hiển thị trạng thái: đã thanh toán, chưa thanh toán, lỗi

---

## 3. MỐI QUAN HỆ GIỮA USE CASES

### 3.1. Quan hệ Include (Bao gồm)
- **UC-C12 (Tạo đơn hàng)** includes **UC-GHN04 (Tính phí vận chuyển)**
- **UC-C12 (Tạo đơn hàng)** includes **UC-ZP01 (Tạo đơn thanh toán ZaloPay)** (nếu chọn ZaloPay)
- **UC-A20 (Cập nhật trạng thái đơn hàng)** includes **UC-GHN06 (Tạo đơn vận chuyển)** (khi chuyển sang SHIPPING)
- **UC-A03 (Tạo sản phẩm mới)** includes **UC-A29 (Upload hình ảnh)** (nếu có hình ảnh)
- **UC-A10 (Tạo danh mục mới)** includes **UC-A29 (Upload hình ảnh)** (nếu có hình ảnh)

### 3.2. Quan hệ Extend (Mở rộng)
- **UC-C17 (Đánh giá sản phẩm)** extends **UC-C12 (Tạo đơn hàng)** (chỉ có thể đánh giá sau khi mua)
- **UC-C15 (Theo dõi đơn hàng)** extends **UC-C12 (Tạo đơn hàng)** (chỉ có thể theo dõi nếu có ghnOrderCode)
- **UC-C16 (Hủy đơn hàng)** extends **UC-C12 (Tạo đơn hàng)** (chỉ có thể hủy đơn đã tạo)
- **UC-A21 (Hủy đơn hàng - Admin)** extends **UC-A20 (Cập nhật trạng thái đơn hàng)**

### 3.3. Quan hệ Generalization (Kế thừa)
- **UC-C13 (Xem danh sách đơn hàng)** và **UC-A18 (Xem danh sách đơn hàng - Admin)** có chức năng tương tự nhưng khác quyền truy cập
- **UC-C14 (Xem chi tiết đơn hàng)** và **UC-A19 (Xem chi tiết đơn hàng - Admin)** có chức năng tương tự nhưng khác quyền truy cập

### 3.4. Quan hệ Dependency (Phụ thuộc)
- **UC-C07 (Thêm vào giỏ hàng)** phụ thuộc vào **UC-G06 (Xem chi tiết sản phẩm)**
- **UC-C12 (Tạo đơn hàng)** phụ thuộc vào **UC-C08 (Xem giỏ hàng)**
- **UC-C17 (Đánh giá sản phẩm)** phụ thuộc vào **UC-C12 (Tạo đơn hàng)** và **UC-C14 (Xem chi tiết đơn hàng)**
- **UC-A06 (Import sản phẩm)** phụ thuộc vào **UC-A07 (Tải template Excel)**

---

## 4. YÊU CẦU ĐẶC BIỆT

### 4.1. Bảo mật
- Tất cả API yêu cầu đăng nhập phải có JWT token hợp lệ
- API Admin phải kiểm tra role = ADMIN
- Password phải được hash bằng bcrypt trước khi lưu
- Email phải unique trong hệ thống
- Chỉ user sở hữu mới có thể xem/sửa đơn hàng của mình (trừ Admin)
- Chỉ user đã mua sản phẩm mới có thể đánh giá

### 4.2. Hiệu suất
- Danh sách sản phẩm nên có phân trang
- Đánh giá sản phẩm nên có phân trang
- Cache danh sách danh mục (ít thay đổi)
- Tối ưu query database (sử dụng include để tránh N+1)

### 4.3. Giao diện người dùng
- Responsive design cho mobile và desktop
- Loading state khi đang tải dữ liệu
- Error handling và hiển thị thông báo lỗi rõ ràng
- Toast notification cho các hành động thành công/thất bại
- Validation form real-time

### 4.4. Tích hợp bên ngoài
- GHN API: Cần có token hợp lệ, xử lý lỗi khi API không khả dụng
- ZaloPay API: Cần có app_id, key1, key2, xác minh chữ ký callback
- AI Chat (Gemini): Cần có API key, xử lý fallback khi model lỗi

### 4.5. Ràng buộc nghiệp vụ
- Stock không được âm
- Số lượng trong giỏ hàng không được vượt quá stock
- Không thể hủy đơn hàng đã COMPLETED hoặc đang SHIPPING (trừ Admin)
- Không thể đánh giá sản phẩm chưa mua
- Không thể đánh giá 2 lần cho cùng một order
- Email thông báo đơn hàng chỉ gửi khi có cấu hình SMTP

### 4.6. Dữ liệu
- Tất cả ID sử dụng format string (có thể là UUID hoặc custom format)
- DateTime sử dụng timezone UTC
- Giá tiền lưu dưới dạng Float (nên cân nhắc Decimal để tránh lỗi làm tròn)
- Hình ảnh lưu path tương đối trong public/uploads

---

## 5. TÓM TẮT SỐ LƯỢNG USE CASES

- **Guest**: 7 Use Cases
- **Customer**: 23 Use Cases
- **Admin**: 29 Use Cases
- **GHN System**: 8 Use Cases
- **ZaloPay System**: 4 Use Cases
- **AI Chat Service**: 1 Use Case (tích hợp trong UC-C22)

**Tổng cộng**: ~72 Use Cases

---

## 6. GHI CHÚ BỔ SUNG

### 6.1. Use Cases chưa được implement đầy đủ
- Quản lý voucher/khuyến mãi
- Quản lý kho hàng (nhập/xuất)
- Quản lý nhà cung cấp
- Hệ thống thông báo (notification)
- Quản lý blog/tin tức
- Hệ thống affiliate/referral

### 6.2. Use Cases có thể mở rộng
- Đánh giá có thể thêm hình ảnh
- So sánh sản phẩm có thể lưu lại để xem sau
- AI Chat có thể tích hợp với database sản phẩm để tư vấn chính xác hơn
- Thống kê có thể export ra Excel/PDF
- Dashboard có thể tùy chỉnh widget

---

*Tài liệu này được tạo tự động dựa trên phân tích codebase. Có thể cần bổ sung và điều chỉnh dựa trên yêu cầu thực tế của dự án.*

