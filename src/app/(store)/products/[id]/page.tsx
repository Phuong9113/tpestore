import { notFound } from "next/navigation";
import Link from "next/link";
import {
  HeartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import ProductReviews from "@/components/ProductReviews";
import ProductReviewForm from "@/components/ProductReviewForm";
import { fetchProductById, fetchProducts, type UiProduct } from "@/lib/api";

export async function generateStaticParams() {
  try {
    const products = await fetchProducts();
    return products.map((product) => ({ id: product.id }));
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { orderId?: string };
}) {
  const product = await fetchProductById(params.id);
  const orderId = searchParams?.orderId;

  if (!product) {
    notFound();
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  // Get related products from same category
  let relatedProducts: UiProduct[] = [];
  try {
    const all = await fetchProducts();
    relatedProducts = all.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  } catch {}

  return (
    <div className="bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link
            href="/products"
            className="hover:text-foreground transition-colors"
          >
            Sản phẩm
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary/30 rounded-2xl overflow-hidden relative">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-sm font-bold">
                  -{discount}%
                </span>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-muted text-muted-foreground px-6 py-3 rounded-lg text-lg font-semibold">
                    Hết hàng
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            <div className="inline-block">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium bg-secondary px-3 py-1.5 rounded-full">
                {product.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < product.rating ? "text-accent" : "text-muted"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.rating}.0 đánh giá)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-foreground">
                  {product.price.toLocaleString("vi-VN")}₫
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {product.originalPrice.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-sm text-destructive font-medium">
                  Tiết kiệm {discount}%
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Mô tả sản phẩm</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                }}
                inStock={product.inStock}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="lg"
                className="w-12 bg-transparent"
              >
                <HeartIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Miễn phí vận chuyển
                  </p>
                  <p className="text-xs text-muted-foreground">Đơn từ 500k</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Bảo hành chính hãng
                  </p>
                  <p className="text-xs text-muted-foreground">12 tháng</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <ArrowPathIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Đổi trả dễ dàng
                  </p>
                  <p className="text-xs text-muted-foreground">Trong 7 ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        {product.specs && product.specs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Thông số kỹ thuật</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  {product.specs.map((spec, index) => (
                    <tr key={spec.id} className={index % 2 === 0 ? "bg-secondary/30" : "bg-card"}>
                      <td className="px-6 py-4 font-semibold text-foreground w-1/3">{spec.specField.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Description */}
        {product.description && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Mô tả chi tiết</h2>
            <div className="bg-card border border-border rounded-xl p-8 space-y-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed text-base">{product.description}</p>
              </div>

              {/* Product Images Gallery */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="aspect-video bg-secondary/30 rounded-lg overflow-hidden">
                  <img
                    src={`/.jpg?key=42ahl&height=400&width=600&query=${product.name} lifestyle`}
                    alt={`${product.name} lifestyle 1`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-video bg-secondary/30 rounded-lg overflow-hidden">
                  <img
                    src={`/.jpg?key=lvaxl&height=400&width=600&query=${product.name} features`}
                    alt={`${product.name} features`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-video bg-secondary/30 rounded-lg overflow-hidden md:col-span-2">
                  <img
                    src={`/.jpg?key=2o3nm&height=400&width=1200&query=${product.name} detail view`}
                    alt={`${product.name} detail`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Review Form - Only show if user has purchased */}
        <ProductReviewForm productId={product.id} orderId={orderId} />

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Sản phẩm liên quan
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  {...relatedProduct}
                  originalPrice={relatedProduct.originalPrice ?? undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
