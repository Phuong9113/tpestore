import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Banner() {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium">
              Sản phẩm mới 2025
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
              Công nghệ tiên tiến cho cuộc sống hiện đại
            </h1>
            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
              Khám phá bộ sưu tập thiết bị điện tử cao cấp với giá tốt nhất. Giao hàng nhanh, bảo hành chính hãng.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="text-base">
                <Link href="/products">Mua sắm ngay</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base bg-transparent">
                <Link href="/products?category=phone">Xem điện thoại</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/50 backdrop-blur">
              <img src="/modern-smartphone-and-laptop-on-desk-with-tech-aes.jpg" alt="Latest electronics" className="w-full h-full object-cover" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giảm giá đến</p>
                  <p className="text-xl font-bold text-accent">30%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
