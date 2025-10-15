import StatsCard from "@/components/admin/StatsCard"
import RevenueChart from "@/components/admin/RevenueChart"
import RecentOrders from "@/components/admin/RecentOrders"
import { ShoppingBagIcon, UsersIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline"

export default function AdminDashboard() {
  const stats = [
    {
      name: "Tổng doanh thu",
      value: "₫124,500,000",
      change: "+12.5%",
      trend: "up" as const,
      icon: CurrencyDollarIcon,
    },
    {
      name: "Đơn hàng",
      value: "1,234",
      change: "+8.2%",
      trend: "up" as const,
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Sản phẩm",
      value: "156",
      change: "+3",
      trend: "up" as const,
      icon: ShoppingBagIcon,
    },
    {
      name: "Khách hàng",
      value: "892",
      change: "+15.3%",
      trend: "up" as const,
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

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <RecentOrders />
      </div>
    </div>
  )
}
