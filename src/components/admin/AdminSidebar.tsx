"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  UsersIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline"

const navigation = [
  { name: "Tổng quan", href: "/dashboard/admin", icon: HomeIcon },
  { name: "Danh mục", href: "/dashboard/admin/categories", icon: TagIcon },
  { name: "Sản phẩm", href: "/dashboard/admin/products", icon: ShoppingBagIcon },
  { name: "Người dùng", href: "/dashboard/admin/users", icon: UsersIcon },
  { name: "Đơn hàng", href: "/dashboard/admin/orders", icon: ClipboardDocumentListIcon },
  { name: "Thống kê", href: "/dashboard/admin/analytics", icon: ChartBarIcon },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/dashboard/admin" className="text-xl font-bold text-foreground">
          TPE Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          // Special handling for dashboard root to avoid matching child routes
          let isActive = false
          if (item.href === "/dashboard/admin") {
            // Exact match only for dashboard root
            isActive = pathname === item.href
          } else {
            // For other routes, match exact or with trailing path
            isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
