import { notFound } from "next/navigation";
import Link from "next/link";
import {
  HeartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/AddToCartButton";
import ProductReviews from "@/components/ProductReviews";
import ProductReviewForm from "@/components/ProductReviewForm";
import ProductDescription from "@/components/ProductDescription";
import ProductSpecs from "@/components/ProductSpecs";
import RelatedProductsSection from "@/components/RelatedProductsSection";
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
          <div className="flex flex-col">
            <div className="bg-secondary/30 rounded-2xl overflow-hidden relative aspect-square max-h-[600px]">
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
          <div className="space-y-6 flex flex-col">
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
                      i < product.rating ? "text-yellow-400" : "text-muted-foreground"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              {product.reviewCount > 0 ? (
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount} đánh giá)
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  (Chưa có đánh giá)
                </span>
              )}
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

        {/* Description and Specifications Side by Side */}
        <div className="mt-16">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Detailed Description - Left Side (2 columns) */}
            <div className="flex flex-col h-full md:col-span-2">
              <h2 className="text-2xl font-bold text-foreground mb-6">Mô tả chi tiết</h2>
              <div className="bg-card border border-border rounded-xl p-8 flex-1 flex flex-col min-h-[400px]">
                {product.description ? (
                  <ProductDescription description={product.description} maxHeight={400} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Chưa có mô tả chi tiết</p>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Table - Right Side (1 column) */}
            <div className="flex flex-col h-full">
              <h2 className="text-2xl font-bold text-foreground mb-6">Thông số kỹ thuật</h2>
              <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 flex flex-col min-h-[400px]">
                {product.specs && product.specs.length > 0 ? (
                  <ProductSpecs specs={product.specs} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Chưa có thông số kỹ thuật</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Review Form - Only show if user has purchased */}
        <ProductReviewForm productId={product.id} orderId={orderId} />

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related Products */}
        <RelatedProductsSection
          currentProduct={product}
          relatedProducts={relatedProducts}
        />
      </div>
    </div>
  );
}
