"use client"

import { useState, useEffect } from "react"
import { fetchTopProducts } from "@/lib/api"

export default function TopProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchTopProducts(5)
        
        if (!cancelled) {
          setProducts(result.products)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch top products:", err)
          setError("Không thể tải dữ liệu")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()
    
    return () => {
      cancelled = true
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Sản phẩm bán chạy</h3>
          <span className="text-sm text-muted-foreground">Top 5</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Sản phẩm bán chạy</h3>
          <span className="text-sm text-muted-foreground">Top 5</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Sản phẩm bán chạy</h3>
          <span className="text-sm text-muted-foreground">Top 5</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chưa có sản phẩm bán chạy</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sản phẩm bán chạy</h3>
        <span className="text-sm text-muted-foreground">Top {products.length}</span>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.id || product.name} className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.sales} đã bán • {formatCurrency(product.revenue)}
              </p>
            </div>
            {product.trend && (
              <span className="text-sm font-medium text-green-500">{product.trend}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
  