"use client"

import Link from "next/link"
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/CartContext"
import { toast } from "sonner"

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="bg-background min-h-[80vh]">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <ShoppingBagIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Giỏ hàng trống</h1>
            <p className="text-muted-foreground">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <Link href="/products">
              <Button size="lg">Tiếp tục mua sắm</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const formatVND = (value: number) => value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })

  const handleRemoveItem = (id: string, name: string) => {
  console.log("%c[CartPage] handleRemoveItem called", "color: red; font-weight: bold;", { id, name })
  removeItem(id)
}

const handleUpdateQuantity = (id: string, quantity: number, name: string) => {
  console.log("%c[CartPage] handleUpdateQuantity called", "color: blue; font-weight: bold;", { id, quantity, name })
  updateQuantity(id, quantity)
}

const handleClearCart = () => {
  console.log("%c[CartPage] handleClearCart called", "color: purple; font-weight: bold;")
  clearCart()
}


  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Giỏ hàng của bạn</h1>
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="text-destructive hover:text-destructive bg-transparent"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Xóa tất cả
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <Link href={`/products/${item.id}`} className="flex-shrink-0">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg bg-secondary/30"
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.id}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-foreground">{formatVND(item.price)}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => handleRemoveItem(item.id, item.name)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 bg-secondary rounded-lg">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.name)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-secondary-foreground/10 rounded-lg transition-colors"
                    >
                      <MinusIcon className="w-4 h-4 text-foreground" />
                    </button>
                    <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.name)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-secondary-foreground/10 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24">
              <h2 className="text-xl font-bold text-foreground">Tóm tắt đơn hàng</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span>{formatVND(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span className="text-accent">Miễn phí</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Tổng cộng</span>
                    <span>{formatVND(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full">
                Thanh toán
              </Button>

              <Link href="/products">
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  Tiếp tục mua sắm
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  Thanh toán an toàn & bảo mật
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  Miễn phí vận chuyển đơn từ 500k
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  Đổi trả trong 7 ngày
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
