import Link from "next/link"
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline"

export default function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-foreground">TPE Store</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cửa hàng điện tử uy tín, chuyên cung cấp các sản phẩm công nghệ chính hãng với giá tốt nhất.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Liên kết</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Vận chuyển
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Danh mục</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products?category=phone"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Điện thoại
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=laptop"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Laptop
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=tablet"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Tablet
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=accessories"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Phụ kiện
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <PhoneIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">1900 xxxx</span>
              </li>
              <li className="flex items-start gap-2">
                <EnvelopeIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">support@tpestore.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPinIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 TPE Store. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
