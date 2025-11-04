"use client"

import { useEffect, useState } from "react"
import { fetchRevenueStatistics, type RevenueStatistics } from "@/lib/api"

interface RevenueChartProps {
  period?: string
}

export default function RevenueChart({ period = "30days" }: RevenueChartProps) {
  const [data, setData] = useState<RevenueStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchRevenueStatistics(period)
        
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch revenue statistics:", err)
          setError("Không thể tải dữ liệu doanh thu")
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
  }, [period])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Doanh thu</h3>
            <p className="text-sm text-muted-foreground mt-1">Đang tải dữ liệu...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Doanh thu</h3>
            <p className="text-sm text-muted-foreground mt-1">{error || "Không có dữ liệu"}</p>
          </div>
        </div>
      </div>
    )
  }

  const chartData = data.chartData || []
  const maxRevenue = chartData.length > 0 
    ? Math.max(...chartData.map((d) => d.revenue))
    : 1

  const getPeriodLabel = () => {
    switch (period) {
      case "7days":
        return "7 ngày qua"
      case "30days":
        return "30 ngày qua"
      case "90days":
        return "90 ngày qua"
      case "1year":
        return "1 năm qua"
      default:
        return "30 ngày qua"
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Doanh thu</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {getPeriodLabel()} - Tổng: {formatCurrency(data.totals.totalRevenue)}
          </p>
        </div>
        {data.totals.revenueChange && (
          <div className="text-right">
            <p className={`text-sm font-medium ${
              parseFloat(data.totals.revenueChange) >= 0 ? "text-green-500" : "text-red-500"
            }`}>
              {parseFloat(data.totals.revenueChange) >= 0 ? "+" : ""}
              {data.totals.revenueChange}%
            </p>
            <p className="text-xs text-muted-foreground">So với kỳ trước</p>
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="relative">
          <div className="flex items-end justify-between gap-2 h-64 min-h-[256px]">
            {/* Placeholder bars with different colors */}
            {Array.from({ length: 7 }).map((_, index) => {
              const placeholderColors = [
                "bg-gradient-to-t from-blue-300 to-blue-200",
                "bg-gradient-to-t from-green-300 to-green-200",
                "bg-gradient-to-t from-purple-300 to-purple-200",
                "bg-gradient-to-t from-orange-300 to-orange-200",
                "bg-gradient-to-t from-pink-300 to-pink-200",
                "bg-gradient-to-t from-cyan-300 to-cyan-200",
                "bg-gradient-to-t from-indigo-300 to-indigo-200",
              ]
              const color = placeholderColors[index % placeholderColors.length]
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-muted/10 rounded-t-lg relative" style={{ height: "100%", minHeight: "256px" }}>
                    <div className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-lg opacity-50`} style={{ height: `${20 + (index * 5)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground/50">---</span>
                </div>
              )
            })}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Chưa có dữ liệu trong khoảng thời gian này
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full">
          {/* Chart container */}
          <div className="relative" style={{ height: "256px", paddingBottom: "0px" }}>
            {/* Chart bars container - aligned to bottom */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2" style={{ height: "256px" }}>
              {chartData.map((item, index) => {
                const heightPercentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                const barHeight = (heightPercentage / 100) * 256
                // Color palette for bars - rotating colors
                const colors = [
                  "bg-gradient-to-t from-blue-500 to-blue-400",
                  "bg-gradient-to-t from-green-500 to-green-400",
                  "bg-gradient-to-t from-purple-500 to-purple-400",
                  "bg-gradient-to-t from-orange-500 to-orange-400",
                  "bg-gradient-to-t from-pink-500 to-pink-400",
                  "bg-gradient-to-t from-cyan-500 to-cyan-400",
                  "bg-gradient-to-t from-indigo-500 to-indigo-400",
                  "bg-gradient-to-t from-emerald-500 to-emerald-400",
                ]
                const hoverColors = [
                  "hover:from-blue-600 hover:to-blue-500",
                  "hover:from-green-600 hover:to-green-500",
                  "hover:from-purple-600 hover:to-purple-500",
                  "hover:from-orange-600 hover:to-orange-500",
                  "hover:from-pink-600 hover:to-pink-500",
                  "hover:from-cyan-600 hover:to-cyan-500",
                  "hover:from-indigo-600 hover:to-indigo-500",
                  "hover:from-emerald-600 hover:to-emerald-500",
                ]
                const barColor = colors[index % colors.length]
                const hoverColor = hoverColors[index % hoverColors.length]
                
                return (
                  <div key={item.period} className="flex-1 flex flex-col items-center h-full group relative">
                    {/* Bar - positioned at bottom */}
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full ${barColor} ${hoverColor} rounded-t-lg transition-all cursor-pointer shadow-md`}
                        style={{ 
                          height: `${Math.max(barHeight, 4)}px`,
                          minHeight: "4px"
                        }}
                        title={`${item.label}: ${formatCurrency(item.revenue)}`}
                      />
                    </div>
                    {/* Label below the chart */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                      <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                    </div>
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute bottom-8 mb-2 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg whitespace-nowrap z-10 shadow-xl font-medium">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Chart grid lines for better visualization */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "256px" }}>
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute left-0 right-0 border-t border-border/20"
                  style={{ bottom: `${(percent / 100) * 256}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
