"use client"

import { ShoppingCartIcon, CheckIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/CartContext"
import { useState } from "react"

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    image: string
  }
  inStock: boolean
  className?: string
}

export default function AddToCartButton({ product, inStock, className }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToCart = () => {
    setIsAdding(true)
    addItem(product)

    setTimeout(() => {
      setIsAdding(false)
      setShowSuccess(true)

      setTimeout(() => {
        setShowSuccess(false)
      }, 2000)
    }, 600)
  }

  return (
    <Button
      size="lg"
      disabled={!inStock || isAdding}
      variant={inStock ? "default" : "secondary"}
      onClick={handleAddToCart}
      className={className}
    >
      <div className="relative w-5 h-5 mr-2">
        <ShoppingCartIcon
          className={`w-5 h-5 absolute transition-all duration-300 ${
            isAdding ? "scale-125 opacity-0" : showSuccess ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <CheckIcon
          className={`w-5 h-5 absolute transition-all duration-300 text-white ${
            showSuccess ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        />
      </div>
      <span className={`transition-all duration-300 ${isAdding ? "scale-95" : "scale-100"}`}>
        {showSuccess ? "Đã thêm!" : inStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
      </span>
    </Button>
  )
}
