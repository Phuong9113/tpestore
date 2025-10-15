"use client"

import Link from "next/link"
import { ShoppingCartIcon, HeartIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/CartContext"

interface ProductCardProps {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating: number
  inStock: boolean
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  rating,
  inStock,
}: ProductCardProps) {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({ id, name, price, image })
  }

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && (
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-bold">
              -{discount}%
            </span>
          )}
          {!inStock && (
            <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-medium">Hết hàng</span>
          )}
        </div>

        {/* Quick actions */}
        <button className="absolute top-3 right-3 w-9 h-9 bg-background/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
          <HeartIcon className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex flex-col flex-1">
        {/* Category */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{category}</p>

        {/* Name */}
        <Link href={`/products/${id}`}>
          <h3 className="font-semibold text-card-foreground line-clamp-2 hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < rating ? "text-accent" : "text-muted"}>
              ★
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-1">({rating}.0)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">{price.toLocaleString("vi-VN")}₫</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{originalPrice.toLocaleString("vi-VN")}₫</span>
          )}
        </div>

        {/* Add to cart button */}
        <Button
          className="w-full mt-auto"
          disabled={!inStock}
          variant={inStock ? "default" : "secondary"}
          onClick={handleAddToCart}
        >
          <ShoppingCartIcon className="w-4 h-4 mr-2" />
          {inStock ? "Thêm vào giỏ" : "Hết hàng"}
        </Button>
      </div>
    </div>
  )
}
