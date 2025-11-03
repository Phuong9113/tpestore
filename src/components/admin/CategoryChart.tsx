"use client"

import { useState, useEffect } from "react"
import { fetchCategoryRevenue } from "@/lib/api"

const colors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
]

export default function CategoryChart() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchCategoryRevenue()
        
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch category revenue:", err)
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
        <h3 className="text-lg font-semibold text-foreground mb-6">Doanh thu theo danh mục</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Doanh thu theo danh mục</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{error || "Không có dữ liệu"}</p>
        </div>
      </div>
    )
  }

  const categories = data.categories || []

  if (categories.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Doanh thu theo danh mục</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chưa có dữ liệu doanh thu theo danh mục</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Doanh thu theo danh mục</h3>

      <div className="space-y-4">
        {categories.map((category: any, index: number) => (
          <div key={category.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">{category.name}</span>
              <span className="text-sm font-medium text-foreground">
                {category.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[index % colors.length]} rounded-full`}
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tổng doanh thu</span>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(data.totalRevenue)}
          </span>
        </div>
      </div>
    </div>
  )
}
