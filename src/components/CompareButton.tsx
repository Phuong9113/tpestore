"use client"

import { Button } from "@/components/ui/button"
import { Squares2X2Icon } from "@heroicons/react/24/outline"
import { useComparison } from "@/contexts/ComparisonContext"
import type { UiProduct } from "@/lib/api"

interface CompareButtonProps {
  product: UiProduct
  className?: string
}

export default function CompareButton({ product, className }: CompareButtonProps) {
  const { addProduct, isProductInComparison, canAddMore } = useComparison()

  const handleCompare = () => {
    if (canAddMore() && !isProductInComparison(product.id)) {
      addProduct(product)
    }
  }

  const isInComparison = isProductInComparison(product.id)
  const disabled = isInComparison || !canAddMore()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCompare}
      disabled={disabled}
      className={className}
      title={
        isInComparison
          ? "Sản phẩm đã được thêm vào so sánh"
          : !canAddMore()
          ? "Đã đạt tối đa 3 sản phẩm để so sánh"
          : "Thêm vào so sánh"
      }
    >
      <Squares2X2Icon className="w-4 h-4 mr-2" />
      {isInComparison ? "Đã thêm" : "So sánh"}
    </Button>
  )
}

