"use client"

import { useState, useEffect } from "react"
import StatsCard from "@/components/admin/StatsCard"
import RevenueChart from "@/components/admin/RevenueChart"
import RecentOrders from "@/components/admin/RecentOrders"
import TopProducts from "@/components/admin/TopProducts"
import { ShoppingBagIcon, UsersIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline"
import { fetchDashboardStats } from "@/lib/api"

export default function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    
    const loadStats = async () => {
      try {
        setLoading(true)
        const data = await fetchDashboardStats()
        
        if (!cancelled) {
          setDashboardStats(data)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load dashboard stats:", err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadStats()
    
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

  const stats = [
    {
      name: "Tổng doanh thu",
      value: loading ? "..." : dashboardStats ? formatCurrency(dashboardStats.totalRevenue) : "₫0",
      change: loading ? "" : dashboardStats 
        ? `${parseFloat(dashboardStats.revenueChange) >= 0 ? "+" : ""}${dashboardStats.revenueChange}%`
        : "0%",
      trend: (dashboardStats?.revenueChange && parseFloat(dashboardStats.revenueChange) >= 0) ? "up" as const : "down" as const,
      icon: CurrencyDollarIcon,
    },
    {
      name: "Đơn hàng",
      value: loading ? "..." : dashboardStats ? dashboardStats.totalOrders.toLocaleString("vi-VN") : "0",
      change: loading ? "" : dashboardStats 
        ? `${parseFloat(dashboardStats.ordersChange) >= 0 ? "+" : ""}${dashboardStats.ordersChange}%`
        : "0%",
      trend: (dashboardStats?.ordersChange && parseFloat(dashboardStats.ordersChange) >= 0) ? "up" as const : "down" as const,
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Sản phẩm",
      value: loading ? "..." : dashboardStats ? dashboardStats.totalProducts.toLocaleString("vi-VN") : "0",
      change: loading ? "" : dashboardStats 
        ? `${parseFloat(dashboardStats.productsChange) >= 0 ? "+" : ""}${dashboardStats.productsChange}%`
        : "0",
      trend: (dashboardStats?.productsChange && parseFloat(dashboardStats.productsChange) >= 0) ? "up" as const : "down" as const,
      icon: ShoppingBagIcon,
    },
    {
      name: "Khách hàng",
      value: loading ? "..." : dashboardStats ? dashboardStats.totalUsers.toLocaleString("vi-VN") : "0",
      change: loading ? "" : dashboardStats 
        ? `${parseFloat(dashboardStats.usersChange) >= 0 ? "+" : ""}${dashboardStats.usersChange}%`
        : "0%",
      trend: (dashboardStats?.usersChange && parseFloat(dashboardStats.usersChange) >= 0) ? "up" as const : "down" as const,
      icon: UsersIcon,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-muted-foreground mt-1">Chào mừng trở lại! Đây là tổng quan về cửa hàng của bạn.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>

      {/* Charts Row: Doanh thu | Top sản phẩm bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart period="30days" />
        <TopProducts />
      </div>

      {/* Recent Orders Row: full width */}
      <div className="grid grid-cols-1 gap-6">
        <RecentOrders />
      </div>
    </div>
  )
}


