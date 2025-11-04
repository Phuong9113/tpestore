"use client"

import { useState, useEffect } from "react"
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline"
import RevenueChart from "@/components/admin/RevenueChart"
import CategoryChart from "@/components/admin/CategoryChart"
import TopProducts from "@/components/admin/TopProducts"
import SalesMap from "@/components/admin/SalesMap"
import { fetchRevenueStatistics } from "@/lib/api"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30days")
  const [revenueData, setRevenueData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    
    const loadRevenueData = async () => {
      try {
        setLoading(true)
        const data = await fetchRevenueStatistics(timeRange)
        
        if (!cancelled) {
          setRevenueData(data)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load revenue data:", err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRevenueData()
    
    return () => {
      cancelled = true
    }
  }, [timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const stats = [
    {
      name: "Doanh thu",
      value: revenueData ? formatCurrency(revenueData.totals.totalRevenue) : "₫0",
      change: revenueData?.totals.revenueChange 
        ? `${parseFloat(revenueData.totals.revenueChange) >= 0 ? "+" : ""}${revenueData.totals.revenueChange}%`
        : "0%",
      trend: (revenueData?.totals.revenueChange && parseFloat(revenueData.totals.revenueChange) >= 0) ? "up" as const : "down" as const,
      icon: CurrencyDollarIcon,
      description: "So với kỳ trước",
    },
    {
      name: "Đơn hàng",
      value: revenueData ? revenueData.totals.totalOrders.toLocaleString("vi-VN") : "0",
      change: "",
      trend: "up" as const,
      icon: ShoppingBagIcon,
      description: "Tổng đơn hàng",
    },
    {
      name: "Giá trị đơn hàng TB",
      value: revenueData ? formatCurrency(revenueData.totals.averageOrderValue) : "₫0",
      change: "",
      trend: "up" as const,
      icon: ArrowTrendingUpIcon,
      description: "Trung bình mỗi đơn",
    },
    {
      name: "Khách hàng mới",
      value: "---",
      change: "",
      trend: "up" as const,
      icon: UsersIcon,
      description: "Trong khoảng thời gian",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thống kê & Phân tích</h1>
          <p className="text-muted-foreground mt-1">Theo dõi hiệu suất kinh doanh và xu hướng</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="90days">90 ngày qua</option>
          <option value="1year">1 năm qua</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <span
                className={`text-sm font-medium ${stat.trend === "up" ? "text-green-500" : "text-red-500"} flex items-center gap-1`}
              >
                {stat.change}
                <ArrowTrendingUpIcon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Doanh thu | Top sản phẩm bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart period={timeRange} />
        <TopProducts />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart />
        <SalesMap />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Giá trị đơn hàng TB</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {loading ? "..." : revenueData ? formatCurrency(revenueData.totals.averageOrderValue) : "₫0"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {revenueData?.totals.totalOrders 
              ? `Từ ${revenueData.totals.totalOrders} đơn hàng` 
              : "Chưa có dữ liệu"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <ShoppingBagIcon className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Tổng đơn hàng</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {loading ? "..." : revenueData ? revenueData.totals.totalOrders.toLocaleString("vi-VN") : "0"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {revenueData?.totals.totalOrders 
              ? `Trong khoảng thời gian đã chọn` 
              : "Chưa có dữ liệu"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Khách hàng</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {loading ? "..." : revenueData ? "---" : "0"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {revenueData?.totals.totalOrders 
              ? `${revenueData.totals.totalOrders} đơn hàng đã hoàn thành` 
              : "Chưa có dữ liệu"}
          </p>
        </div>
      </div>
    </div>
  )
}


