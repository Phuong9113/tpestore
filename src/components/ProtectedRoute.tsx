"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { me, type AuthUser } from "@/lib/auth"
import Link from "next/link"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authUser = await me()
        if (!authUser) {
          router.push('/login')
          return
        }
        
        if (requireAdmin && authUser.role !== 'ADMIN') {
          router.push('/')
          return
        }
        
        setUser(authUser)
      } catch (err) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, requireAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {requireAdmin ? 'Truy cập bị từ chối' : 'Cần đăng nhập'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {requireAdmin 
              ? 'Bạn không có quyền truy cập trang quản trị' 
              : 'Vui lòng đăng nhập để truy cập trang này'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <Link 
              href="/login" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Đăng nhập
            </Link>
            {!requireAdmin && (
              <Link 
                href="/register" 
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary"
              >
                Đăng ký
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
