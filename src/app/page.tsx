import Banner from "@/components/Banner"
import ProductCard from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { fetchProducts } from "@/lib/api"

export default async function HomePage() {
  const allProducts = await fetchProducts()
  const featuredProducts = allProducts.slice(0, 8)

  return (
    <div>
      {/* Hero Banner */}
      <Banner />

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Sản phẩm nổi bật</h2>
            <p className="text-muted-foreground">Khám phá các sản phẩm công nghệ mới nhất</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/products">Xem tất cả</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice || undefined}
              image={product.image}
              category={product.category}
              rating={product.rating}
              inStock={product.inStock}
            />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Danh mục sản phẩm</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Điện thoại", image: "/modern-smartphone.png", href: "/products?category=phone" },
              { name: "Laptop", image: "/modern-laptop.png", href: "/products?category=laptop" },
              { name: "Tablet", image: "/modern-tablet.png", href: "/products?category=tablet" },
              { name: "Phụ kiện", image: "/tech-accessories-headphones.jpg", href: "/products?category=accessories" },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative aspect-square rounded-xl overflow-hidden bg-card border border-border hover:shadow-lg transition-all"
              >
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end p-6">
                  <h3 className="text-2xl font-bold text-foreground">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🚚",
              title: "Giao hàng nhanh",
              description: "Miễn phí vận chuyển cho đơn hàng trên 5 triệu",
            },
            {
              icon: "🛡️",
              title: "Bảo hành chính hãng",
              description: "Bảo hành 12 tháng, đổi trả trong 7 ngày",
            },
            {
              icon: "💳",
              title: "Thanh toán linh hoạt",
              description: "Hỗ trợ trả góp 0%, thanh toán online",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-xl"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
