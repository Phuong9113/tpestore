import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { CartProvider } from "@/contexts/CartContext"
import ConditionalLayout from "@/components/ConditionalLayout"

export const metadata: Metadata = {
  title: "TPE Store - Electronics & Technology",
  description: "Your trusted destination for the latest electronics and technology products",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <CartProvider>
          <Suspense fallback={null}>
            <ConditionalLayout>{children}</ConditionalLayout>
          </Suspense>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
