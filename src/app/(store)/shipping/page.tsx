import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chính sách vận chuyển - TPE Store",
  description: "Tìm hiểu về chính sách vận chuyển và giao hàng tại TPE Store - Giao hàng nhanh, an toàn, miễn phí.",
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Chính sách vận chuyển
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Giao hàng nhanh chóng, an toàn và miễn phí cho mọi đơn hàng
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Shipping Overview */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Tổng quan vận chuyển</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                TPE Store cam kết giao hàng nhanh chóng, an toàn và đúng hẹn cho tất cả khách hàng trên toàn quốc. 
                Chúng tôi hợp tác với các đơn vị vận chuyển uy tín để đảm bảo sản phẩm đến tay khách hàng trong tình trạng tốt nhất.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-6">
                <h3 className="font-semibold text-foreground mb-3">🚚 Cam kết của chúng tôi</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Giao hàng miễn phí cho đơn hàng từ 500.000đ</li>
                  <li>• Giao hàng trong 24-48h tại TP.HCM</li>
                  <li>• Giao hàng trong 2-5 ngày tại các tỉnh thành khác</li>
                  <li>• Đóng gói chắc chắn, bảo vệ sản phẩm</li>
                  <li>• Theo dõi đơn hàng trực tuyến 24/7</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Shipping Methods */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Phương thức vận chuyển</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-secondary/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏍️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Giao hàng nhanh</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Giao trong 2-4 giờ (TP.HCM)</li>
                  <li>• Phí vận chuyển: 30.000đ</li>
                  <li>• Áp dụng cho đơn hàng dưới 500.000đ</li>
                  <li>• Thời gian: 8:00 - 20:00</li>
                </ul>
              </div>

              <div className="bg-secondary/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🚛</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Giao hàng tiêu chuẩn</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Giao trong 24-48h (TP.HCM)</li>
                  <li>• Miễn phí cho đơn từ 500.000đ</li>
                  <li>• Phí vận chuyển: 20.000đ</li>
                  <li>• Áp dụng toàn quốc</li>
                </ul>
              </div>

              <div className="bg-secondary/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✈️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Giao hàng xa</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Giao trong 2-5 ngày</li>
                  <li>• Miễn phí cho đơn từ 1.000.000đ</li>
                  <li>• Phí vận chuyển: 50.000đ</li>
                  <li>• Áp dụng các tỉnh miền xa</li>
                </ul>
              </div>

              <div className="bg-secondary/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏪</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Nhận tại cửa hàng</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Miễn phí vận chuyển</li>
                  <li>• Nhận ngay sau 2 giờ</li>
                  <li>• Kiểm tra sản phẩm trực tiếp</li>
                  <li>• Hỗ trợ tư vấn tại chỗ</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Delivery Process */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Quy trình giao hàng</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Xác nhận đơn hàng</h4>
                  <p className="text-sm text-muted-foreground">Chúng tôi sẽ gọi điện xác nhận đơn hàng trong vòng 30 phút</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Chuẩn bị hàng</h4>
                  <p className="text-sm text-muted-foreground">Kiểm tra và đóng gói sản phẩm cẩn thận, bảo vệ tối đa</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Giao cho đơn vị vận chuyển</h4>
                  <p className="text-sm text-muted-foreground">Chuyển hàng cho đối tác vận chuyển uy tín</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Theo dõi vận chuyển</h4>
                  <p className="text-sm text-muted-foreground">Cập nhật trạng thái vận chuyển qua SMS và email</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  5
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Giao hàng thành công</h4>
                  <p className="text-sm text-muted-foreground">Khách hàng kiểm tra và ký xác nhận nhận hàng</p>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Areas */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Khu vực giao hàng</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Thành phố Hồ Chí Minh</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Quận 1, 3, 5, 10, 11: Giao trong 2-4 giờ</p>
                  <p>• Các quận khác: Giao trong 24-48 giờ</p>
                  <p>• Huyện ngoại thành: Giao trong 2-3 ngày</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Các tỉnh thành khác</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Hà Nội, Đà Nẵng: 2-3 ngày</p>
                  <p>• Các tỉnh miền Nam: 2-4 ngày</p>
                  <p>• Các tỉnh miền Trung: 3-5 ngày</p>
                  <p>• Các tỉnh miền Bắc: 4-6 ngày</p>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Fees */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Bảng phí vận chuyển</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Khu vực</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Thời gian</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Phí vận chuyển</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Miễn phí từ</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 text-muted-foreground">TP.HCM (nội thành)</td>
                    <td className="py-3 px-4 text-muted-foreground">2-4 giờ</td>
                    <td className="py-3 px-4 text-muted-foreground">30.000đ</td>
                    <td className="py-3 px-4 text-muted-foreground">500.000đ</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 text-muted-foreground">TP.HCM (ngoại thành)</td>
                    <td className="py-3 px-4 text-muted-foreground">24-48 giờ</td>
                    <td className="py-3 px-4 text-muted-foreground">20.000đ</td>
                    <td className="py-3 px-4 text-muted-foreground">500.000đ</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 text-muted-foreground">Hà Nội, Đà Nẵng</td>
                    <td className="py-3 px-4 text-muted-foreground">2-3 ngày</td>
                    <td className="py-3 px-4 text-muted-foreground">40.000đ</td>
                    <td className="py-3 px-4 text-muted-foreground">800.000đ</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4 text-muted-foreground">Các tỉnh khác</td>
                    <td className="py-3 px-4 text-muted-foreground">3-5 ngày</td>
                    <td className="py-3 px-4 text-muted-foreground">50.000đ</td>
                    <td className="py-3 px-4 text-muted-foreground">1.000.000đ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Contact Info */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Liên hệ hỗ trợ vận chuyển</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Thông tin liên hệ</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-medium text-foreground">Hotline vận chuyển</p>
                      <p className="text-muted-foreground">1900 xxxx (24/7)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium text-foreground">Email hỗ trợ</p>
                      <p className="text-muted-foreground">shipping@tpestore.vn</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-foreground">Địa chỉ kho</p>
                      <p className="text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Lưu ý quan trọng</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Kiểm tra sản phẩm trước khi ký nhận</p>
                  <p>• Giữ lại hóa đơn để bảo hành</p>
                  <p>• Liên hệ ngay nếu có vấn đề về giao hàng</p>
                  <p>• Thời gian giao hàng có thể thay đổi do thời tiết</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
