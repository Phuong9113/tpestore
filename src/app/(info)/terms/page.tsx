import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Điều khoản sử dụng - TPE Store",
  description: "Tìm hiểu về điều khoản và điều kiện sử dụng dịch vụ tại TPE Store.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Điều khoản sử dụng
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Điều khoản và điều kiện sử dụng dịch vụ TPE Store
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Giới thiệu</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Chào mừng bạn đến với TPE Store! Điều khoản sử dụng này ("Điều khoản") quy định việc sử dụng 
                website và dịch vụ của TPE Store ("Dịch vụ") được cung cấp bởi TPE Store ("Chúng tôi", "Công ty").
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Bằng việc truy cập hoặc sử dụng Dịch vụ của chúng tôi, bạn đồng ý bị ràng buộc bởi các Điều khoản này. 
                Nếu bạn không đồng ý với bất kỳ phần nào của các Điều khoản này, bạn không được phép sử dụng Dịch vụ.
              </p>
            </div>
          </section>

          {/* Acceptance of Terms */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Chấp nhận điều khoản</h2>
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">✅ Bằng việc sử dụng dịch vụ, bạn xác nhận rằng:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Bạn đã đọc và hiểu các Điều khoản này</li>
                  <li>• Bạn đồng ý tuân thủ tất cả các quy định</li>
                  <li>• Bạn có đủ năng lực pháp lý để tham gia hợp đồng</li>
                  <li>• Bạn từ 18 tuổi trở lên hoặc có sự đồng ý của người giám hộ</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Service Description */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Mô tả dịch vụ</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">TPE Store cung cấp:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Cửa hàng trực tuyến bán các sản phẩm công nghệ</li>
                  <li>• Dịch vụ giao hàng và vận chuyển</li>
                  <li>• Hỗ trợ khách hàng và bảo hành sản phẩm</li>
                  <li>• Các tiện ích và công cụ hỗ trợ mua sắm</li>
                </ul>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">📱 Sản phẩm chính</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p>• Điện thoại di động</p>
                    <p>• Laptop và máy tính</p>
                    <p>• Tablet và máy tính bảng</p>
                  </div>
                  <div>
                    <p>• Phụ kiện điện tử</p>
                    <p>• Thiết bị âm thanh</p>
                    <p>• Các sản phẩm công nghệ khác</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* User Account */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Tài khoản người dùng</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">1. Đăng ký tài khoản</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Bạn phải cung cấp thông tin chính xác và đầy đủ</li>
                  <li>• Bạn chịu trách nhiệm bảo mật mật khẩu</li>
                  <li>• Mỗi người chỉ được tạo một tài khoản</li>
                  <li>• Chúng tôi có quyền từ chối đăng ký không hợp lệ</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">2. Trách nhiệm của người dùng</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Cập nhật thông tin khi có thay đổi</li>
                  <li>• Báo cáo ngay khi tài khoản bị xâm nhập</li>
                  <li>• Không chia sẻ thông tin đăng nhập</li>
                  <li>• Tuân thủ các quy định sử dụng</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">3. Chấm dứt tài khoản</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Bạn có thể xóa tài khoản bất kỳ lúc nào</li>
                  <li>• Chúng tôi có quyền khóa tài khoản vi phạm</li>
                  <li>• Dữ liệu sẽ được xóa theo chính sách bảo mật</li>
                  <li>• Một số thông tin có thể được lưu trữ theo quy định pháp luật</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Orders and Payments */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Đơn hàng và thanh toán</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">1. Đặt hàng</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Đơn hàng có hiệu lực khi được xác nhận</li>
                  <li>• Chúng tôi có quyền từ chối đơn hàng không hợp lệ</li>
                  <li>• Giá sản phẩm có thể thay đổi mà không báo trước</li>
                  <li>• Hình ảnh sản phẩm chỉ mang tính minh họa</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">2. Thanh toán</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Chấp nhận thanh toán qua thẻ, chuyển khoản, COD</li>
                  <li>• Thông tin thanh toán được mã hóa an toàn</li>
                  <li>• Phí giao dịch (nếu có) sẽ được thông báo rõ ràng</li>
                  <li>• Hoàn tiền theo chính sách đổi trả</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">3. Giao hàng</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Thời gian giao hàng có thể thay đổi do yếu tố khách quan</li>
                  <li>• Khách hàng chịu trách nhiệm kiểm tra hàng hóa</li>
                  <li>• Chúng tôi không chịu trách nhiệm nếu khách hàng không có mặt</li>
                  <li>• Phí vận chuyển theo bảng giá hiện hành</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Returns and Refunds */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Đổi trả và hoàn tiền</h2>
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">📋 Chính sách đổi trả</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Đổi trả trong vòng 7 ngày kể từ ngày nhận hàng</li>
                  <li>• Sản phẩm phải còn nguyên vẹn, đầy đủ phụ kiện</li>
                  <li>• Không áp dụng cho sản phẩm đã kích hoạt bảo hành</li>
                  <li>• Phí đổi trả do khách hàng chịu (trừ lỗi từ nhà sản xuất)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Điều kiện hoàn tiền</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Hoàn tiền 100% cho sản phẩm lỗi từ nhà sản xuất</li>
                  <li>• Hoàn tiền 90% cho đổi trả do lý do cá nhân</li>
                  <li>• Thời gian xử lý hoàn tiền: 3-7 ngày làm việc</li>
                  <li>• Hoàn tiền qua phương thức thanh toán ban đầu</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Sử dụng bị cấm</h2>
            <div className="space-y-4">
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">❌ Các hành vi bị cấm</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                  <li>• Vi phạm quyền sở hữu trí tuệ của bên thứ ba</li>
                  <li>• Gửi spam, virus hoặc mã độc hại</li>
                  <li>• Cố gắng hack hoặc phá hoại hệ thống</li>
                  <li>• Tạo tài khoản giả mạo hoặc gian lận</li>
                  <li>• Sử dụng bot hoặc công cụ tự động không được phép</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Hậu quả vi phạm</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Cảnh báo và yêu cầu chấm dứt hành vi</li>
                  <li>• Khóa tài khoản tạm thời hoặc vĩnh viễn</li>
                  <li>• Xóa nội dung vi phạm</li>
                  <li>• Báo cáo cho cơ quan chức năng nếu cần thiết</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Sở hữu trí tuệ</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Quyền sở hữu</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Tất cả nội dung trên website thuộc sở hữu của TPE Store</li>
                  <li>• Logo, thương hiệu, thiết kế được bảo hộ bản quyền</li>
                  <li>• Không được sao chép, phân phối mà không có sự đồng ý</li>
                  <li>• Sản phẩm của nhà sản xuất tuân theo bản quyền của họ</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Sử dụng nội dung</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Chỉ được sử dụng cho mục đích cá nhân, phi thương mại</li>
                  <li>• Không được chỉnh sửa, tạo tác phẩm phái sinh</li>
                  <li>• Phải ghi rõ nguồn gốc khi sử dụng</li>
                  <li>• Vi phạm sẽ bị xử lý theo pháp luật</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Giới hạn trách nhiệm</h2>
            <div className="space-y-4">
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">⚠️ Tuyên bố miễn trừ</h3>
                <p className="text-sm text-muted-foreground">
                  TPE Store không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, 
                  đặc biệt hoặc hậu quả nào phát sinh từ việc sử dụng dịch vụ của chúng tôi.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Các trường hợp miễn trừ</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Thiệt hại do sử dụng không đúng cách sản phẩm</li>
                  <li>• Mất mát dữ liệu do lỗi người dùng</li>
                  <li>• Gián đoạn dịch vụ do bảo trì hoặc sự cố</li>
                  <li>• Thiệt hại do lỗi từ nhà sản xuất sản phẩm</li>
                  <li>• Thiệt hại do yếu tố bất khả kháng</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Luật áp dụng và giải quyết tranh chấp</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Luật áp dụng</h3>
                <p className="text-muted-foreground">
                  Các Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh 
                  sẽ được giải quyết theo quy định của pháp luật Việt Nam.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Giải quyết tranh chấp</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Ưu tiên giải quyết thông qua thương lượng</li>
                  <li>• Trung tâm trọng tài thương mại Việt Nam</li>
                  <li>• Tòa án có thẩm quyền tại TP.HCM</li>
                  <li>• Ngôn ngữ giải quyết: Tiếng Việt</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Thay đổi điều khoản</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Chúng tôi có quyền cập nhật các Điều khoản này bất kỳ lúc nào. Khi có thay đổi, 
                chúng tôi sẽ thông báo cho bạn thông qua:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Thông báo</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Email cho tất cả người dùng</li>
                    <li>• Thông báo trên website</li>
                    <li>• Cập nhật ngày hiệu lực</li>
                  </ul>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Hiệu lực</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Có hiệu lực sau 30 ngày</li>
                    <li>• Tiếp tục sử dụng = chấp nhận</li>
                    <li>• Không chấp nhận = ngừng sử dụng</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Thông tin liên hệ</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-4">TPE Store</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-foreground">Địa chỉ</p>
                      <p className="text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-medium text-foreground">Hotline</p>
                      <p className="text-muted-foreground">1900 xxxx</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">support@tpestore.vn</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Giờ làm việc</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                  <p>Thứ 7: 8:00 - 17:00</p>
                  <p>Chủ nhật: 9:00 - 16:00</p>
                  <p className="text-sm mt-4 text-primary">
                    * Hotline hỗ trợ 24/7
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
