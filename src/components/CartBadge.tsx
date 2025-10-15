"use client"

import { useCart } from "@/contexts/CartContext"
import { useEffect, useState } from "react"

export default function CartBadge() {
  const { totalItems } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || totalItems === 0) return null

  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium">
      {totalItems}
    </span>
  )
}
