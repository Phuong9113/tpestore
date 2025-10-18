import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chính sách bảo mật - TPE Store",
  description: "Tìm hiểu về chính sách bảo mật và bảo vệ thông tin cá nhân tại TPE Store.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Chính sách bảo mật
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Cam kết bảo vệ thông tin cá nhân và quyền riêng tư của khách hàng
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
                TPE Store cam kết bảo vệ quyền riêng tư và thông tin cá nhân của khách hàng. 
                Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ 
                thông tin của bạn khi sử dụng dịch vụ của chúng tôi.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Bằng việc sử dụng website và dịch vụ của TPE Store, bạn đồng ý với việc thu thập và sử dụng 
                thông tin theo chính sách này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi.
              </p>
            </div>
          </section>

          {/* Information Collection */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Thông tin chúng tôi thu thập</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">1. Thông tin cá nhân</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Họ tên, địa chỉ email, số điện thoại</li>
                  <li>• Địa chỉ giao hàng và thanh toán</li>
                  <li>• Thông tin tài khoản ngân hàng (khi thanh toán)</li>
                  <li>• Ngày sinh, giới tính (tùy chọn)</li>
                  <li>• Thông tin xác thực danh tính</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">2. Thông tin sử dụng dịch vụ</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Lịch sử mua hàng và giao dịch</li>
                  <li>• Sở thích và hành vi mua sắm</li>
                  <li>• Đánh giá và phản hồi về sản phẩm</li>
                  <li>• Thông tin liên hệ hỗ trợ khách hàng</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">3. Thông tin kỹ thuật</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Địa chỉ IP và thông tin trình duyệt</li>
                  <li>• Dữ liệu cookies và tracking</li>
                  <li>• Thông tin thiết bị và hệ điều hành</li>
                  <li>• Dữ liệu phân tích website</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Cách chúng tôi sử dụng thông tin</h2>
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">🎯 Mục đích sử dụng chính</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Xử lý đơn hàng và giao dịch</li>
                  <li>• Cung cấp dịch vụ khách hàng</li>
                  <li>• Cải thiện trải nghiệm người dùng</li>
                  <li>• Gửi thông báo và cập nhật</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Dịch vụ cốt lõi</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Xử lý thanh toán</li>
                    <li>• Vận chuyển và giao hàng</li>
                    <li>• Hỗ trợ bảo hành</li>
                    <li>• Quản lý tài khoản</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Cải thiện dịch vụ</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Phân tích hành vi người dùng</li>
                    <li>• Cá nhân hóa nội dung</li>
                    <li>• Phát triển sản phẩm mới</li>
                    <li>• Marketing và quảng cáo</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Chia sẻ thông tin</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Chúng tôi KHÔNG bán thông tin cá nhân</h3>
                <p className="text-muted-foreground mb-4">
                  TPE Store cam kết không bán, cho thuê hoặc trao đổi thông tin cá nhân của khách hàng 
                  cho bên thứ ba vì mục đích thương mại.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Chia sẻ trong các trường hợp sau:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Đối tác dịch vụ:</strong> Các công ty vận chuyển, thanh toán để thực hiện đơn hàng</li>
                  <li>• <strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền</li>
                  <li>• <strong>Bảo vệ quyền lợi:</strong> Để bảo vệ quyền lợi, tài sản hoặc an toàn của TPE Store</li>
                  <li>• <strong>Đồng ý của khách hàng:</strong> Khi có sự đồng ý rõ ràng từ phía khách hàng</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Bảo mật dữ liệu</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Biện pháp bảo mật</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Mã hóa SSL/TLS cho tất cả dữ liệu</li>
                    <li>• Hệ thống tường lửa và bảo mật</li>
                    <li>• Kiểm soát truy cập nghiêm ngặt</li>
                    <li>• Sao lưu dữ liệu định kỳ</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Giám sát và kiểm tra</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Giám sát hệ thống 24/7</li>
                    <li>• Kiểm tra bảo mật định kỳ</li>
                    <li>• Cập nhật bảo mật thường xuyên</li>
                    <li>• Đào tạo nhân viên về bảo mật</li>
                  </ul>
                </div>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">⚠️ Lưu ý quan trọng</h3>
                <p className="text-sm text-muted-foreground">
                  Mặc dù chúng tôi áp dụng các biện pháp bảo mật tiên tiến, không có phương thức truyền tải 
                  hoặc lưu trữ điện tử nào là 100% an toàn. Chúng tôi không thể đảm bảo tuyệt đối về bảo mật 
                  thông tin của bạn.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies Policy */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Chính sách Cookies</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Chúng tôi sử dụng cookies và công nghệ tương tự để cải thiện trải nghiệm người dùng, 
                phân tích lưu lượng truy cập và cá nhân hóa nội dung.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Cookies cần thiết</h4>
                  <p className="text-sm text-muted-foreground">
                    Cần thiết cho hoạt động cơ bản của website
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Cookies phân tích</h4>
                  <p className="text-sm text-muted-foreground">
                    Giúp chúng tôi hiểu cách bạn sử dụng website
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Cookies marketing</h4>
                  <p className="text-sm text-muted-foreground">
                    Để hiển thị quảng cáo phù hợp với sở thích
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Quyền của khách hàng</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Quyền truy cập và kiểm soát</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Xem thông tin cá nhân đã lưu trữ</li>
                    <li>• Cập nhật hoặc sửa đổi thông tin</li>
                    <li>• Xóa tài khoản và dữ liệu</li>
                    <li>• Tải xuống dữ liệu cá nhân</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Quyền từ chối và rút lại</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Từ chối nhận email marketing</li>
                    <li>• Rút lại đồng ý bất kỳ lúc nào</li>
                    <li>• Yêu cầu ngừng xử lý dữ liệu</li>
                    <li>• Khiếu nại về việc xử lý dữ liệu</li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">📞 Liên hệ thực hiện quyền</h3>
                <p className="text-sm text-muted-foreground">
                  Để thực hiện các quyền trên, vui lòng liên hệ với chúng tôi qua email: 
                  <span className="text-primary font-medium">privacy@tpestore.vn</span> hoặc hotline: 
                  <span className="text-primary font-medium">1900 xxxx</span>
                </p>
              </div>
            </div>
          </section>

          {/* Policy Updates */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Cập nhật chính sách</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian để phản ánh những thay đổi 
                trong cách chúng tôi thu thập, sử dụng hoặc bảo vệ thông tin của bạn.
              </p>
              
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Thông báo thay đổi</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Thông báo qua email cho tất cả khách hàng</li>
                  <li>• Hiển thị thông báo trên website</li>
                  <li>• Cập nhật ngày "Cập nhật lần cuối" ở đầu trang</li>
                  <li>• Thời gian có hiệu lực: 30 ngày kể từ ngày thông báo</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Liên hệ về bảo mật</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Thông tin liên hệ</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium text-foreground">Email bảo mật</p>
                      <p className="text-muted-foreground">privacy@tpestore.vn</p>
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
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-foreground">Địa chỉ</p>
                      <p className="text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Thời gian phản hồi</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Email: Trong vòng 24 giờ</p>
                  <p>• Hotline: 8:00 - 18:00 (T2-T6)</p>
                  <p>• Khiếu nại: 5-7 ngày làm việc</p>
                  <p>• Yêu cầu dữ liệu: 30 ngày</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
