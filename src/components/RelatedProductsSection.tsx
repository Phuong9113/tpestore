"use client"

import ProductCard from "@/components/ProductCard"
import ProductComparisonWrapper from "./ProductComparisonWrapper"
import type { UiProduct } from "@/lib/api"

interface RelatedProductsSectionProps {
  currentProduct: UiProduct
  relatedProducts: UiProduct[]
}

export default function RelatedProductsSection({
  currentProduct,
  relatedProducts,
}: RelatedProductsSectionProps) {
  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <ProductComparisonWrapper currentProduct={currentProduct}>
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
              showCompareButton={true}
            />
          ))}
        </div>
      </div>
    </ProductComparisonWrapper>
  )
}

