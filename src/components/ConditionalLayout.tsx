"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Header from "./Header"
import Footer from "./Footer"
import ToastContainer from "./ToastContainer"

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ToastContainer />
    </>
  )
}
