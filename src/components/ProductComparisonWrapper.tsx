"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Squares2X2Icon } from "@heroicons/react/24/outline"
import { useComparison } from "@/contexts/ComparisonContext"
import ComparisonModal from "./ComparisonModal"
import type { UiProduct } from "@/lib/api"

interface ProductComparisonWrapperProps {
  currentProduct: UiProduct
  children: React.ReactNode
}

export default function ProductComparisonWrapper({
  currentProduct,
  children,
}: ProductComparisonWrapperProps) {
  const { products } = useComparison()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const prevProductsLengthRef = useRef(0)

  const hasComparisonProducts = products.length > 0

  // Auto-open modal when a product is added
  useEffect(() => {
    if (products.length > prevProductsLengthRef.current && products.length > 0) {
      setIsModalOpen(true)
    }
    prevProductsLengthRef.current = products.length
  }, [products.length])

  return (
    <>
      {children}
      {hasComparisonProducts && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="rounded-full shadow-lg text-sm sm:text-base"
          >
            <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">So sánh </span>
            <span>({products.length})</span>
          </Button>
        </div>
      )}
      <ComparisonModal
        currentProduct={{
          id: currentProduct.id,
          name: currentProduct.name,
          image: currentProduct.image,
          specs: currentProduct.specs,
        }}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}

