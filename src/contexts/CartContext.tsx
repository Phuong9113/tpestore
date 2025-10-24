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
  const [lastToken, setLastToken] = useState<string | null>(null)

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Detect token changes and reload cart accordingly
  useEffect(() => {
    if (!isClient) return

    const currentToken = getToken()
    
    // Nếu token thay đổi (từ có token -> không có token hoặc ngược lại)
    if (currentToken !== lastToken) {
      console.log('[CartContext] Token changed:', { from: lastToken, to: currentToken })
      
      if (currentToken) {
        // Đăng nhập: load từ server
        ;(async () => {
          try {
            console.log('[CartContext] Loading cart from server...')
            const serverItems = await fetchCart()
            console.log('[CartContext] Server items:', serverItems)
            const mappedItems = serverItems.map((i) => ({ id: i.productId, name: i.name, price: i.price, image: i.image, quantity: i.quantity }))
            console.log('[CartContext] Mapped items:', mappedItems)
            setItems(mappedItems)
          } catch (error) {
            console.error('[CartContext] Failed to load from server:', error)
            setItems([])
          }
        })()
      } else {
        // Đăng xuất: clear cart và load từ sessionStorage
        console.log('[CartContext] User logged out, clearing cart')
        setItems([])
        
        // Load từ sessionStorage nếu có
        const savedCart = sessionStorage.getItem("tpe-cart")
        if (savedCart) {
          console.log('[CartContext] Loading from sessionStorage:', JSON.parse(savedCart))
          setItems(JSON.parse(savedCart))
        }
      }
      
      setLastToken(currentToken)
    }
  }, [isClient, lastToken])

  // Listen for storage changes (when user logs out in another tab)
  useEffect(() => {
    if (!isClient) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tpestore_token' && e.newValue === null) {
        // Token was removed (user logged out)
        console.log('[CartContext] Token removed from storage, clearing cart')
        setItems([])
        setLastToken(null)
      }
    }

    const handleUserLoggedOut = () => {
      console.log('[CartContext] User logged out event received, clearing cart')
      setItems([])
      setLastToken(null)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userLoggedOut', handleUserLoggedOut)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userLoggedOut', handleUserLoggedOut)
    }
  }, [isClient])


  // Lưu cart vào sessionStorage khi items thay đổi (chỉ khi chưa đăng nhập)
  useEffect(() => {
    if (isClient) {
      const token = getToken()
      if (!token) {
        // Chưa đăng nhập: lưu vào sessionStorage
        console.log('[CartContext] Saving to sessionStorage:', items)
        sessionStorage.setItem("tpe-cart", JSON.stringify(items))
      }
      // Đã đăng nhập: không lưu vào storage, chỉ lưu vào database
    }
  }, [items, isClient])

  const addItem = async (item: Omit<CartItem, "quantity">) => {
    const exists = items.find((i) => i.id === item.id)
    if (exists) {
      // Kiểm tra nếu đã đạt giới hạn
      if (exists.quantity >= 100) {
        toast.error("Số lượng không thể vượt quá 100")
        return
      }
      
      // Cập nhật số lượng thay vì thêm mới
      const newQuantity = exists.quantity + 1
      updateQuantity(item.id, newQuantity)
      return
    }

    const token = getToken()
    if (token) {
      try {
        await addToCart(item.id, 1)
      } catch (error) {
        console.error('Add to cart error:', error)
        toast.error("Không thể đồng bộ giỏ hàng với máy chủ")
        return
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

    console.log(`[CartContext] updateQuantity called: id=${id}, quantity=${quantity}, current=${item.quantity}`)

    if (quantity <= 0) {
      removeItem(id) // toast đã được gọi trong removeItem
      return
    }

    // Giới hạn số lượng tối đa
    if (quantity > 100) {
      toast.error("Số lượng không thể vượt quá 100")
      return
    }

    // Cập nhật state trước
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
    
    const token = getToken()
    if (token) {
      try { 
        console.log(`[CartContext] Calling API updateCartItem: id=${id}, quantity=${quantity}`)
        await updateCartItem(id, quantity) 
        console.log(`[CartContext] API updateCartItem success`)
      } catch (error) {
        console.error(`[CartContext] API updateCartItem failed:`, error)
        // Revert state nếu API call thất bại
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: item.quantity } : i)))
        toast.error("Không thể cập nhật số lượng")
        return
      }
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

  // Function để clear cart khi đăng xuất (không hiển thị toast)
  const clearCartSilently = () => {
    setItems([])
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
