import Link from "next/link";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo/logo.png"
                alt="TPE Store Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">
                TPE Store
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cửa hàng điện tử uy tín, chuyên cung cấp các sản phẩm công nghệ
              chính hãng với giá tốt nhất.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Liên kết</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href="/warranty"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
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
                <span className="text-sm text-muted-foreground">
                  0376560307
                </span>
              </li>
              <li className="flex items-start gap-2">
                <EnvelopeIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  tpestore@gmail.com
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPinIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Thủ Dầu Một, Tp.Hồ Chí Minh
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    d="M16.5 2.75h-2.25c-2.485 0-4.5 2.015-4.5 4.5V9.25H7.5A.75.75 0 0 0 6.75 10v2A.75.75 0 0 0 7.5 12.75h2.25v7.5A.75.75 0 0 0 10.5 21h3a.75.75 0 0 0 .75-.75v-7.5h2.025a.75.75 0 0 0 .747-.82l-.263-2A.75.75 0 0 0 16.01 9.25H14.25V8.25c0-.414.336-.75.75-.75h1.5a.75.75 0 0 0 0-1.5z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <a
                  href="https://www.facebook.com/people/TPE-STORE/61579338122689/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  TPE Store
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 TPE Store. All rights reserved.
            </p>
            <div className="flex gap-6 items-center">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Chính sách bảo mật
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
