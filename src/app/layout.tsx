import React, { Suspense } from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/contexts/CartContext"
import { ComparisonProvider } from "@/contexts/ComparisonContext"
import ConditionalLayout from "@/components/ConditionalLayout"
import AuthSessionProvider from "@/components/SessionProvider"

export const metadata: Metadata = {
  title: "TPE Store",
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
        <AuthSessionProvider>
          <CartProvider>
            <ComparisonProvider>
              <Suspense fallback={null}>
                <ConditionalLayout>{children}</ConditionalLayout>
              </Suspense>
            </ComparisonProvider>
          </CartProvider>
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
