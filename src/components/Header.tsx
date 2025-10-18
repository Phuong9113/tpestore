"use client"

import Link from "next/link"
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon, ChevronDownIcon, CogIcon } from "@heroicons/react/24/outline"
import Navbar from "./Navbar"
import { useCart } from "@/contexts/CartContext"
import { useEffect, useState } from "react"
import { me, clearToken, type AuthUser } from "@/lib/auth"

export default function Header() {
  const { totalItems } = useCart()
  const [animate, setAnimate] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    if (totalItems > 0) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 600)
      return () => clearTimeout(timer)
    }
  }, [totalItems])

  useEffect(() => {
    ;(async () => {
      const u = await me()
      setUser(u)
    })()
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo/logo.png"
              alt="TPE Store Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-foreground">TPE Store</span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link href="/cart" className="relative p-2 hover:bg-secondary rounded-lg transition-colors group">
              <ShoppingCartIcon
                className={`w-6 h-6 text-foreground transition-transform ${animate ? "animate-bounce" : ""}`}
              />
              {totalItems > 0 && (
                <span
                  className={`absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium transition-all ${
                    animate ? "scale-125 animate-pulse" : "scale-100"
                  }`}
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Account Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <UserIcon className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">
                  {user ? (user.name || user.email) : 'Tài khoản'}
                </span>
                <ChevronDownIcon className="w-4 h-4 hidden md:inline" />
              </button>

              {/* Dropdown Menu */}
              {showAccountMenu && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {user ? (
                      <>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Thông tin cá nhân
                        </Link>
                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            Dashboard Admin
                          </Link>
                        )}
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          onClick={() => {
                            clearToken()
                            setUser(null)
                            setShowAccountMenu(false)
                          }}
                        >
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Đăng nhập
                        </Link>
                        <Link
                          href="/register"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          onClick={() => setShowAccountMenu(false)}
                        >
                          Đăng ký
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <Navbar />
      </div>
    </header>
  )
}
