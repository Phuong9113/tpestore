"use client"

import { useState, useEffect } from "react"
import { fetchSalesByRegion } from "@/lib/api"

const colors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-gray-500",
]

export default function SalesMap() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchSalesByRegion()
        
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch sales by region:", err)
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

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Doanh số theo khu vực</h3>
          <span className="text-sm text-muted-foreground">Việt Nam</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Doanh số theo khu vực</h3>
          <span className="text-sm text-muted-foreground">Việt Nam</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{error || "Không có dữ liệu"}</p>
        </div>
      </div>
    )
  }

  const regions = data.regions || []

  if (regions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Doanh số theo khu vực</h3>
          <span className="text-sm text-muted-foreground">Việt Nam</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chưa có dữ liệu doanh số theo khu vực</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Doanh số theo khu vực</h3>
        <span className="text-sm text-muted-foreground">Việt Nam</span>
      </div>

      <div className="space-y-3">
        {regions.map((region: any, index: number) => (
          <div key={region.name} className="flex items-center gap-3">
            <div
              className={`w-3 h-3 ${colors[index % colors.length]} rounded-full flex-shrink-0`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground">{region.name}</span>
                <span className="text-sm font-medium text-foreground">
                  {region.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors[index % colors.length]}`}
                  style={{ width: `${region.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Khu vực hàng đầu</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {data.topRegion || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng doanh số</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }).format(data.totalSales || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
  