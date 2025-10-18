import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Về chúng tôi - TPE Store",
  description: "Tìm hiểu về TPE Store - Cửa hàng điện tử uy tín chuyên cung cấp các sản phẩm công nghệ chính hãng.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Về chúng tôi
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            TPE Store - Cửa hàng điện tử uy tín, chuyên cung cấp các sản phẩm công nghệ chính hãng với giá tốt nhất
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Company Story */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Câu chuyện của chúng tôi</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                TPE Store được thành lập với sứ mệnh mang đến cho khách hàng những sản phẩm công nghệ chất lượng cao 
                với giá cả hợp lý. Chúng tôi tin rằng công nghệ nên được tiếp cận dễ dàng và phù hợp với mọi người.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Với hơn 5 năm kinh nghiệm trong lĩnh vực bán lẻ điện tử, chúng tôi đã xây dựng được mối quan hệ 
                đối tác vững chắc với các thương hiệu hàng đầu thế giới, đảm bảo mang đến cho khách hàng những 
                sản phẩm chính hãng 100%.
              </p>
            </div>
          </section>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8">
            <section className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Sứ mệnh</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cung cấp các sản phẩm công nghệ chính hãng với chất lượng tốt nhất, giá cả cạnh tranh và dịch vụ 
                khách hàng tận tâm, giúp mọi người dễ dàng tiếp cận với công nghệ hiện đại.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Tầm nhìn</h3>
              <p className="text-muted-foreground leading-relaxed">
                Trở thành cửa hàng điện tử hàng đầu Việt Nam, được tin tưởng bởi hàng triệu khách hàng và là 
                đối tác tin cậy của các thương hiệu công nghệ lớn trên thế giới.
              </p>
            </section>
          </div>

          {/* Values */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Giá trị cốt lõi</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Chất lượng</h3>
                <p className="text-sm text-muted-foreground">
                  Chỉ bán sản phẩm chính hãng 100%, đảm bảo chất lượng và độ bền cao
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Giá cả hợp lý</h3>
                <p className="text-sm text-muted-foreground">
                  Cung cấp sản phẩm với giá cả cạnh tranh nhất thị trường
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">❤️</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Dịch vụ tận tâm</h3>
                <p className="text-sm text-muted-foreground">
                  Hỗ trợ khách hàng 24/7 với đội ngũ chuyên nghiệp
                </p>
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Thông tin liên hệ</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Địa chỉ</h3>
                <p className="text-muted-foreground">
                  123 Đường ABC, Quận 1<br />
                  Thành phố Hồ Chí Minh, Việt Nam
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Liên hệ</h3>
                <p className="text-muted-foreground">
                  📞 Hotline: 1900 xxxx<br />
                  📧 Email: support@tpestore.vn
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
