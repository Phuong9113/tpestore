"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon, ChevronDownIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline"
import { me, clearToken, type AuthUser } from "@/lib/auth"

export default function AdminHeader() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const u = await me()
      setUser(u)
    }
    loadUser()
  }, [])

  const handleLogout = () => {
    clearToken()
    setUser(null)
    router.push('/')
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <UserCircleIcon className="w-8 h-8" />
            <div className="text-left">
              <div className="text-sm font-medium">{user?.name || user?.email || 'Admin'}</div>
              <div className="text-xs text-muted-foreground">Quản trị viên</div>
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    router.push('/profile')
                    setShowUserMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => {
                    handleLogout()
                    setShowUserMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
