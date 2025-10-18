import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chính sách bảo hành - TPE Store",
  description: "Tìm hiểu về chính sách bảo hành sản phẩm tại TPE Store - Bảo hành chính hãng, đổi trả dễ dàng.",
}

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Chính sách bảo hành
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Cam kết bảo hành chính hãng cho tất cả sản phẩm tại TPE Store
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Warranty Overview */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Tổng quan bảo hành</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Tất cả sản phẩm tại TPE Store đều được bảo hành chính hãng theo tiêu chuẩn của nhà sản xuất. 
                Chúng tôi cam kết mang đến cho khách hàng sự yên tâm tuyệt đối khi mua sắm.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-6">
                <h3 className="font-semibold text-foreground mb-3">✅ Cam kết của chúng tôi</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Bảo hành chính hãng 100%</li>
                  <li>• Hỗ trợ bảo hành toàn quốc</li>
                  <li>• Thời gian bảo hành theo tiêu chuẩn nhà sản xuất</li>
                  <li>• Dịch vụ sửa chữa chuyên nghiệp</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Warranty Terms */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Điều kiện bảo hành</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">1. Sản phẩm được bảo hành</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Tất cả sản phẩm chính hãng mua tại TPE Store</li>
                  <li>• Sản phẩm còn trong thời hạn bảo hành</li>
                  <li>• Sản phẩm có đầy đủ hóa đơn và phiếu bảo hành</li>
                  <li>• Sản phẩm không bị hỏng do tác động vật lý từ bên ngoài</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">2. Thời gian bảo hành</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Điện thoại & Tablet</h4>
                    <p className="text-sm text-muted-foreground">12-24 tháng tùy theo hãng sản xuất</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Laptop & Máy tính</h4>
                    <p className="text-sm text-muted-foreground">12-36 tháng tùy theo hãng sản xuất</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Phụ kiện</h4>
                    <p className="text-sm text-muted-foreground">6-12 tháng tùy theo loại sản phẩm</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Thiết bị âm thanh</h4>
                    <p className="text-sm text-muted-foreground">12-24 tháng tùy theo hãng sản xuất</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">3. Quy trình bảo hành</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Liên hệ hỗ trợ</h4>
                      <p className="text-sm text-muted-foreground">Gọi hotline 1900 xxxx hoặc đến trực tiếp cửa hàng</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Kiểm tra sản phẩm</h4>
                      <p className="text-sm text-muted-foreground">Nhân viên kiểm tra tình trạng và xác nhận điều kiện bảo hành</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Xử lý bảo hành</h4>
                      <p className="text-sm text-muted-foreground">Sửa chữa tại trung tâm bảo hành chính hãng hoặc thay thế linh kiện</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Hoàn trả sản phẩm</h4>
                      <p className="text-sm text-muted-foreground">Giao trả sản phẩm đã được bảo hành cho khách hàng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Exclusions */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Trường hợp không được bảo hành</h2>
            <div className="space-y-4">
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">❌ Các trường hợp loại trừ</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Sản phẩm bị hỏng do va đập, rơi vỡ, ngấm nước</li>
                  <li>• Sản phẩm bị can thiệp, sửa chữa bởi bên thứ ba</li>
                  <li>• Sản phẩm bị mất hoặc thiếu phụ kiện đi kèm</li>
                  <li>• Sản phẩm bị hỏng do sử dụng không đúng cách</li>
                  <li>• Sản phẩm đã hết thời hạn bảo hành</li>
                  <li>• Sản phẩm không có hóa đơn mua hàng hợp lệ</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Liên hệ hỗ trợ bảo hành</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Thông tin liên hệ</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-medium text-foreground">Hotline bảo hành</p>
                      <p className="text-muted-foreground">1900 xxxx (24/7)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium text-foreground">Email hỗ trợ</p>
                      <p className="text-muted-foreground">warranty@tpestore.vn</p>
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
                <h3 className="font-semibold text-foreground mb-4">Giờ làm việc</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                  <p>Thứ 7: 8:00 - 17:00</p>
                  <p>Chủ nhật: 9:00 - 16:00</p>
                  <p className="text-sm mt-4 text-primary">
                    * Hotline hỗ trợ 24/7 cho các trường hợp khẩn cấp
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
