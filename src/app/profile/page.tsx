"use client"

import { useEffect, useState } from "react"
import {
  UserIcon,
  MapPinIcon,
  ClockIcon,
  CreditCardIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CogIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"
import { me, updateMe, type AuthUser } from "@/lib/auth"
import Image from "next/image"
import ProtectedRoute from "@/components/ProtectedRoute"

interface UserProfile {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
}

interface Order {
  id: string
  date: string
  total: number
  status: "Đang xử lý" | "Đang giao" | "Đã giao" | "Đã hủy"
  items: number
}

interface Address {
  id: string
  name: string
  phone: string
  address: string
  city: string
  postalCode: string
  isDefault: boolean
}

interface PaymentMethod {
  id: string
  type: "card" | "bank"
  name: string
  number: string
  isDefault: boolean
}

interface OrderItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
}

interface OrderDetail {
  id: string
  date: string
  status: "Đang xử lý" | "Đang giao" | "Đã giao" | "Đã hủy"
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    name: string
    phone: string
    address: string
  }
  paymentMethod: string
  timeline: {
    status: string
    date: string
    description: string
  }[]
}

type TabType = "profile" | "orders" | "addresses" | "payment"

function ProfilePageContent() {
  const [activeTab, setActiveTab] = useState<TabType>("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  })

  useEffect(() => {
    ;(async () => {
      const u = await me()
      setAuthUser(u)
      if (u) {
        setProfile((prev) => ({
          ...prev,
          name: u.name || "",
          email: u.email,
        }))
      }
      setLoading(false)
    })()
  }, [])

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile)

  // Mock order history
  const orders: Order[] = [
    { id: "ORD001", date: "2024-01-15", total: 25990000, status: "Đã giao", items: 2 },
    { id: "ORD002", date: "2024-01-10", total: 15490000, status: "Đang giao", items: 1 },
    { id: "ORD003", date: "2024-01-05", total: 8990000, status: "Đã giao", items: 3 },
  ]

  const [addresses] = useState<Address[]>([
    {
      id: "1",
      name: "Nguyễn Văn A",
      phone: "0123456789",
      address: "123 Đường ABC, Quận 1",
      city: "Hồ Chí Minh",
      postalCode: "700000",
      isDefault: true,
    },
    {
      id: "2",
      name: "Nguyễn Văn A",
      phone: "0987654321",
      address: "456 Đường XYZ, Quận 3",
      city: "Hồ Chí Minh",
      postalCode: "700000",
      isDefault: false,
    },
  ])

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      name: "Visa",
      number: "**** **** **** 1234",
      isDefault: true,
    },
    {
      id: "2",
      type: "bank",
      name: "Vietcombank",
      number: "**** **** **** 5678",
      isDefault: false,
    },
  ])

  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)

  const orderDetails: Record<string, OrderDetail> = {
    ORD001: {
      id: "ORD001",
      date: "2024-01-15",
      status: "Đã giao",
      items: [
        {
          id: "iphone-15-pro",
          name: "iPhone 15 Pro Max 256GB",
          image: "/iphone-15-pro-hands.png",
          price: 29990000,
          quantity: 1,
        },
        {
          id: "airpods-pro-2",
          name: "AirPods Pro 2 USB-C",
          image: "/airpods-pro-lifestyle.png",
          price: 6490000,
          quantity: 1,
        },
      ],
      subtotal: 36480000,
      shipping: 0,
      tax: 3648000,
      total: 40128000,
      shippingAddress: {
        name: "Nguyễn Văn A",
        phone: "0123456789",
        address: "123 Đường ABC, Quận 1, Hồ Chí Minh",
      },
      paymentMethod: "Visa **** 1234",
      timeline: [
        { status: "Đã giao", date: "2024-01-18 14:30", description: "Đơn hàng đã được giao thành công" },
        { status: "Đang giao", date: "2024-01-17 08:00", description: "Đơn hàng đang được giao đến bạn" },
        { status: "Đang xử lý", date: "2024-01-16 10:00", description: "Đơn hàng đang được chuẩn bị" },
        { status: "Đã đặt", date: "2024-01-15 16:45", description: "Đơn hàng đã được đặt thành công" },
      ],
    },
    ORD002: {
      id: "ORD002",
      date: "2024-01-10",
      status: "Đang giao",
      items: [
        {
          id: "macbook-pro-m3",
          name: "MacBook Pro 14 inch M3 Pro 18GB",
          image: "/silver-macbook-pro-desk.png",
          price: 52990000,
          quantity: 1,
        },
      ],
      subtotal: 52990000,
      shipping: 0,
      tax: 5299000,
      total: 58289000,
      shippingAddress: {
        name: "Nguyễn Văn A",
        phone: "0123456789",
        address: "123 Đường ABC, Quận 1, Hồ Chí Minh",
      },
      paymentMethod: "Visa **** 1234",
      timeline: [
        { status: "Đang giao", date: "2024-01-12 08:00", description: "Đơn hàng đang được giao đến bạn" },
        { status: "Đang xử lý", date: "2024-01-11 10:00", description: "Đơn hàng đang được chuẩn bị" },
        { status: "Đã đặt", date: "2024-01-10 14:20", description: "Đơn hàng đã được đặt thành công" },
      ],
    },
    ORD003: {
      id: "ORD003",
      date: "2024-01-05",
      status: "Đã giao",
      items: [
        {
          id: "logitech-mx-master-3s",
          name: "Logitech MX Master 3S Wireless Mouse",
          image: "/logitech-mouse.jpg",
          price: 2490000,
          quantity: 1,
        },
        {
          id: "keychron-k8-pro",
          name: "Keychron K8 Pro Mechanical Keyboard",
          image: "/mechanical-keyboard.jpg",
          price: 3290000,
          quantity: 1,
        },
        {
          id: "anker-powerbank",
          name: "Anker PowerCore 20000mAh PD 30W",
          image: "/power-bank.jpg",
          price: 1290000,
          quantity: 2,
        },
      ],
      subtotal: 8360000,
      shipping: 30000,
      tax: 836000,
      total: 9226000,
      shippingAddress: {
        name: "Nguyễn Văn A",
        phone: "0987654321",
        address: "456 Đường XYZ, Quận 3, Hồ Chí Minh",
      },
      paymentMethod: "Vietcombank **** 5678",
      timeline: [
        { status: "Đã giao", date: "2024-01-08 15:20", description: "Đơn hàng đã được giao thành công" },
        { status: "Đang giao", date: "2024-01-07 09:00", description: "Đơn hàng đang được giao đến bạn" },
        { status: "Đang xử lý", date: "2024-01-06 11:00", description: "Đơn hàng đang được chuẩn bị" },
        { status: "Đã đặt", date: "2024-01-05 18:30", description: "Đơn hàng đã được đặt thành công" },
      ],
    },
  }

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveError("")
      const updated = await updateMe({ name: editedProfile.name })
      setProfile((prev) => ({ ...prev, name: updated.name || "" }))
      setIsEditing(false)
    } catch (e) {
      setSaveError("Cập nhật thất bại")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Đã giao":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Đang giao":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Đang xử lý":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "Đã hủy":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang tải...</div>
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Chi tiết đơn hàng #{selectedOrder.id}</h2>
                <p className="text-sm text-muted-foreground mt-1">Đặt ngày {selectedOrder.date}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Trạng thái đơn hàng</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Lịch sử đơn hàng</h3>
                <div className="space-y-4">
                  {selectedOrder.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-primary" : "bg-muted"}`} />
                        {index !== selectedOrder.timeline.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-foreground">{event.status}</p>
                        <p className="text-sm text-muted-foreground">{event.date}</p>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Sản phẩm ({selectedOrder.items.length})</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">Số lượng: {item.quantity}</p>
                        <p className="text-lg font-semibold text-foreground mt-2">
                          {item.price.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Địa chỉ giao hàng</h3>
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-medium text-foreground">{selectedOrder.shippingAddress.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.shippingAddress.phone}</p>
                  <p className="text-sm text-foreground mt-2">{selectedOrder.shippingAddress.address}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Phương thức thanh toán</h3>
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="w-6 h-6 text-primary" />
                    <p className="text-foreground">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Tổng kết đơn hàng</h3>
                <div className="space-y-3 p-4 border border-border rounded-lg">
                  <div className="flex justify-between text-foreground">
                    <span>Tạm tính</span>
                    <span>{selectedOrder.subtotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>Phí vận chuyển</span>
                    <span>
                      {selectedOrder.shipping === 0 ? "Miễn phí" : `${selectedOrder.shipping.toLocaleString("vi-VN")}₫`}
                    </span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>Thuế VAT (10%)</span>
                    <span>{selectedOrder.tax.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{selectedOrder.total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-foreground">Thông tin cá nhân</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
                  <UserIcon className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{profile.name || authUser?.email}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    authUser?.role === "ADMIN" 
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>
                    {authUser?.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                  </span>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "profile"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <ClockIcon className="w-5 h-5" />
                  Lịch sử đơn hàng
                </button>
                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "addresses"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <MapPinIcon className="w-5 h-5" />
                  Địa chỉ giao hàng
                </button>
                <button
                  onClick={() => setActiveTab("payment")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "payment"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <CreditCardIcon className="w-5 h-5" />
                  Phương thức thanh toán
                </button>
                
                {/* Admin Dashboard Link - Only show for ADMIN role */}
                {authUser?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors hover:bg-secondary text-foreground"
                  >
                    <CogIcon className="w-5 h-5" />
                    Dashboard Admin
                  </Link>
                )}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-2">
            {/* Profile Information Tab */}
            {activeTab === "profile" && (
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Thông tin cá nhân</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-foreground"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                      >
                        {saving ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  )}
                </div>

                {saveError && (
                  <div className="mb-4 text-sm text-destructive">{saveError}</div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Họ và tên</label>
                    <input
                      type="text"
                      value={isEditing ? editedProfile.name : profile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <input
                      type="email"
                      value={isEditing ? editedProfile.email : profile.email}
                      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      value={isEditing ? editedProfile.phone : profile.phone}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Mã bưu điện</label>
                    <input
                      type="text"
                      value={isEditing ? editedProfile.postalCode : profile.postalCode}
                      onChange={(e) => setEditedProfile({ ...editedProfile, postalCode: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      value={isEditing ? editedProfile.address : profile.address}
                      onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Thành phố</label>
                    <input
                      type="text"
                      value={isEditing ? editedProfile.city : profile.city}
                      onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Lịch sử đơn hàng</h3>

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">Đơn hàng #{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">{order.items} sản phẩm</div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{order.total.toLocaleString("vi-VN")}₫</p>
                          <button
                            onClick={() => setSelectedOrder(orderDetails[order.id])}
                            className="text-sm text-primary hover:underline"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Địa chỉ giao hàng</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    Thêm địa chỉ
                  </button>
                </div>

                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-foreground">{address.name}</p>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{address.phone}</p>
                          <p className="text-sm text-foreground">
                            {address.address}, {address.city}, {address.postalCode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <PencilIcon className="w-4 h-4 text-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      {!address.isDefault && (
                        <button className="text-sm text-primary hover:underline">Đặt làm mặc định</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "payment" && (
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Phương thức thanh toán</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    Thêm thẻ
                  </button>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <CreditCardIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{method.name}</p>
                              {method.isDefault && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.number}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {method.type === "card" ? "Thẻ tín dụng" : "Tài khoản ngân hàng"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <PencilIcon className="w-4 h-4 text-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      {!method.isDefault && (
                        <button className="text-sm text-primary hover:underline">Đặt làm mặc định</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  )
}
