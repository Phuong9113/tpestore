import { getToken } from './auth'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000') + '/api/v1'

export interface CartApiItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchCart(): Promise<CartApiItem[]> {
  const res = await fetch(`${API_BASE}/cart`, { headers: { ...authHeaders() }, cache: 'no-store' })
  if (res.status === 401) {
    // Chưa đăng nhập hoặc token không hợp lệ: coi như giỏ hàng trống
    return []
  }
  if (!res.ok) throw new Error('Không tải được giỏ hàng')
  const json = await res.json()
  const payload = json?.data ?? json
  return Array.isArray(payload?.items) ? (payload.items as CartApiItem[]) : []
}

export async function addToCart(productId: string, quantity = 1) {
  const res = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ productId, quantity }),
  })
  if (!res.ok) throw new Error('Thêm vào giỏ thất bại')
}

export async function updateCartItem(productId: string, quantity: number) {
  const res = await fetch(`${API_BASE}/cart/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) throw new Error('Cập nhật số lượng thất bại')
}

export async function removeFromCart(productId: string) {
  const res = await fetch(`${API_BASE}/cart/${productId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error('Xóa khỏi giỏ thất bại')
}

export async function clearCartApi() {
  const res = await fetch(`${API_BASE}/cart`, { method: 'DELETE', headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Xóa giỏ hàng thất bại')
}



