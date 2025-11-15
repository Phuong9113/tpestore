"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useComparison } from "@/contexts/ComparisonContext"
import type { ApiSpec } from "@/lib/api"

interface ComparisonModalProps {
  currentProduct: {
    id: string
    name: string
    image: string
    specs?: ApiSpec[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ComparisonModal({
  currentProduct,
  open,
  onOpenChange,
}: ComparisonModalProps) {
  const { products, removeProduct, clearProducts } = useComparison()

  // Combine current product with comparison products
  const allProducts = [
    {
      id: currentProduct.id,
      name: currentProduct.name,
      image: currentProduct.image,
      specs: currentProduct.specs || [],
    },
    ...products.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      specs: p.specs || [],
    })),
  ]

  // Get all unique spec field names from all products
  const getAllSpecFields = () => {
    const fieldMap = new Map<string, string>()
    allProducts.forEach((product) => {
      product.specs.forEach((spec) => {
        if (!fieldMap.has(spec.specField.id)) {
          fieldMap.set(spec.specField.id, spec.specField.name)
        }
      })
    })
    return Array.from(fieldMap.entries()).map(([id, name]) => ({ id, name }))
  }

  const specFields = getAllSpecFields()

  // Get spec value for a product by spec field id
  const getSpecValue = (productId: string, specFieldId: string): string => {
    const product = allProducts.find((p) => p.id === productId)
    if (!product) return "-"
    const spec = product.specs.find((s) => s.specField.id === specFieldId)
    return spec?.value || "-"
  }

  const handleRemoveProduct = (productId: string) => {
    if (productId === currentProduct.id) {
      // Cannot remove current product
      return
    }
    removeProduct(productId)
  }


  if (allProducts.length === 1) {
    // Only current product, no comparison products added yet
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>So sánh sản phẩm</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
          <p className="text-muted-foreground mb-4">
            Chưa có sản phẩm nào được thêm vào so sánh.
          </p>
          <p className="text-sm text-muted-foreground">
            Nhấn nút "So sánh" trên sản phẩm liên quan để thêm vào so sánh.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="text-lg sm:text-xl">So sánh sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-2 sm:px-6">
          {/* Product Headers */}
          <div className="sticky top-0 bg-background z-10 pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4">
            <div
              className="grid gap-2 sm:gap-4 overflow-x-auto"
              style={{ gridTemplateColumns: `minmax(100px, 200px) repeat(${allProducts.length}, minmax(100px, 1fr))` }}
            >
              <div className="font-semibold text-foreground text-xs sm:text-sm">Thông số</div>
              {allProducts.map((product) => (
                <div key={product.id} className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className="relative w-full aspect-square max-w-[80px] sm:max-w-[120px] bg-secondary/30 rounded-lg overflow-hidden">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground text-center line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  {product.id !== currentProduct.id && (
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-destructive transition-colors underline"
                      title="Xóa khỏi so sánh"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {specFields.length === 0 ? (
                  <tr>
                    <td
                      colSpan={allProducts.length + 1}
                      className="px-4 sm:px-6 py-12 text-center text-muted-foreground"
                    >
                      Không có thông số kỹ thuật để so sánh
                    </td>
                  </tr>
                ) : (
                  specFields.map((field, index) => (
                    <tr
                      key={field.id}
                      className={index % 2 === 0 ? "bg-secondary/30" : "bg-card"}
                    >
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-semibold text-foreground text-xs sm:text-sm sticky left-0 bg-inherit z-0 min-w-[100px] sm:min-w-[150px] sm:max-w-[200px]">
                        {field.name}
                      </td>
                      {allProducts.map((product) => (
                        <td
                          key={product.id}
                          className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-muted-foreground text-center text-xs sm:text-sm"
                        >
                          {getSpecValue(product.id, field.id)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-background">
          <Button variant="outline" onClick={clearProducts} size="sm" className="text-xs sm:text-sm">
            Xóa tất cả
          </Button>
          <Button onClick={() => onOpenChange(false)} size="sm" className="text-xs sm:text-sm">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

