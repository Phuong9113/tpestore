"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "sonner"
import { getToken } from "@/lib/auth"
import { addToCart, clearCartApi, fetchCart, removeFromCart, updateCartItem } from "@/lib/cart"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isClient, setIsClient] = useState(false)

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load cart từ backend nếu đã đăng nhập, nếu không thì từ localStorage
  useEffect(() => {
    if (!isClient) return

    const token = getToken()
    if (token) {
      ;(async () => {
        try {
          const serverItems = await fetchCart()
          setItems(serverItems.map((i) => ({ id: i.productId, name: i.name, price: i.price, image: i.image, quantity: i.quantity })))
        } catch {
          // fallback local
          const savedCart = localStorage.getItem("tpe-cart")
          if (savedCart) setItems(JSON.parse(savedCart))
        }
      })()
    } else {
      const savedCart = localStorage.getItem("tpe-cart")
      if (savedCart) setItems(JSON.parse(savedCart))
    }
  }, [isClient])

  // Lưu cart vào localStorage khi items thay đổi
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("tpe-cart", JSON.stringify(items))
    }
  }, [items, isClient])

  const addItem = async (item: Omit<CartItem, "quantity">) => {
    const exists = items.find((i) => i.id === item.id)
    if (exists) {
      toast(`${item.name} đã có trong giỏ hàng`, { action: "Đóng", richColors: true })
      return
    }

    const token = getToken()
    if (token) {
      try {
        await addToCart(item.id, 1)
      } catch {
        toast.error("Không thể đồng bộ giỏ hàng với máy chủ")
      }
    }

    setItems((prev) => [...prev, { ...item, quantity: 1 }])
    toast.success(`Đã thêm ${item.name} vào giỏ hàng`, { action: "Đóng", richColors: true })
  }

  const removeItem = async (id: string) => {
    const itemToRemove = items.find((i) => i.id === id)
    if (!itemToRemove) return

    setItems((prev) => prev.filter((i) => i.id !== id))
    const token = getToken()
    if (token) {
      try { await removeFromCart(id) } catch {}
    }
    toast.error(`Đã xóa ${itemToRemove.name} khỏi giỏ hàng`, { action: "Đóng", richColors: true })
  }

  const updateQuantity = async (id: string, quantity: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    if (quantity <= 0) {
      removeItem(id) // toast đã được gọi trong removeItem
      return
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
    const token = getToken()
    if (token) {
      try { await updateCartItem(id, quantity) } catch {}
    }
    toast(`${item.name} đã được cập nhật số lượng: ${quantity}`, { action: "Đóng", richColors: true })
  }

  const clearCart = async () => {
    if (items.length === 0) return
    setItems([])
    const token = getToken()
    if (token) {
      try { await clearCartApi() } catch {}
    }
    toast.error("Đã xóa tất cả sản phẩm khỏi giỏ hàng", { action: "Đóng", richColors: true })
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within a CartProvider")
  return context
}
