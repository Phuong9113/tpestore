"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { UiProduct } from "@/lib/api"

interface ComparisonContextType {
  products: UiProduct[]
  addProduct: (product: UiProduct) => void
  removeProduct: (productId: string) => void
  clearProducts: () => void
  isProductInComparison: (productId: string) => boolean
  canAddMore: () => boolean
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<UiProduct[]>([])
  const MAX_PRODUCTS = 3

  const addProduct = (product: UiProduct) => {
    setProducts((prev) => {
      // Check if product already exists
      if (prev.some((p) => p.id === product.id)) {
        return prev
      }
      // Check if we can add more
      if (prev.length >= MAX_PRODUCTS) {
        return prev
      }
      return [...prev, product]
    })
  }

  const removeProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const clearProducts = () => {
    setProducts([])
  }

  const isProductInComparison = (productId: string) => {
    return products.some((p) => p.id === productId)
  }

  const canAddMore = () => {
    return products.length < MAX_PRODUCTS
  }

  return (
    <ComparisonContext.Provider
      value={{
        products,
        addProduct,
        removeProduct,
        clearProducts,
        isProductInComparison,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider")
  }
  return context
}

