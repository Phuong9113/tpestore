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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { me, updateMe, type AuthUser } from "@/lib/auth"
import { 
  fetchUserProfile, 
  updateUserProfile, 
  cancelUserOrder, 
  api,
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type Address as AddressType
} from "@/lib/api"
import { toast } from "sonner"
import Image from "next/image"
import ProtectedRoute from "@/components/ProtectedRoute"
import { resolveStatusLabel } from "@/lib/shipping-status"

interface UserProfile {
  name: string
  email: string
  phone: string
  birthDate?: string
  gender?: 'Nam' | 'Nữ' | 'Khác'
}

interface Order {
  id: string
  date: string
  total: number
  status: "Đang xử lý" | "Đang giao" | "Đã giao" | "Đã hủy" | "Đã thanh toán"
  items: number
  ghnOrderCode?: string
}

// Address interface is now imported from api.ts


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
  status: "Đang xử lý" | "Đang giao" | "Đã giao" | "Đã hủy" | "Đã thanh toán"
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  shippingAddress: {
    name: string
    phone: string
    address: string
    province?: string
    district?: string
    ward?: string
  }
  paymentMethod: string
  ghnOrderCode?: string
  timeline: {
    status: string
    date: string
    description: string
  }[]
}

type TabType = "profile" | "orders" | "addresses"

// GHN location types (same as checkout)
interface Province { ProvinceID: number; ProvinceName: string }
interface District { DistrictID: number; DistrictName: string }
interface Ward { WardCode: string; WardName: string }

function ProfilePageContent() {
  const [activeTab, setActiveTab] = useState<TabType>("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: undefined,
  })

  useEffect(() => {
    ;(async () => {
      try {
        const u = await me()
        setAuthUser(u)
        
        // Fetch detailed profile from API
        const userData = await fetchUserProfile()
        
        setProfile({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          birthDate: (userData.birthDate as string) || "",
          gender: (userData.gender as any) || undefined,
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Fallback to auth user data
        const u = await me()
        if (u) {
          setProfile((prev) => ({
            ...prev,
            name: u.name || "",
            email: u.email,
          }))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile)

  // When entering edit mode, preload current profile values so user doesn't need to retype unchanged fields
  useEffect(() => {
    if (isEditing) {
      setEditedProfile(profile)
    }
  }, [isEditing, profile])

  // Real order history from API
  const [orders, setOrders] = useState<Order[]>([])
  // Map GHN order code -> latest GHN status string
  const [ghnStatuses, setGhnStatuses] = useState<Record<string, string>>({})
  // Map GHN order code -> raw GHN logs (array)
  const [ghnLogs, setGhnLogs] = useState<Record<string, Array<{ status: string; updated_date: string }>>>({})
  // Map GHN order code -> last normalized payload snapshot (for debugging)
  const [ghnDebug, setGhnDebug] = useState<Record<string, { currentStatus?: string; status?: string; logs?: number }>>({})
  const [addresses, setAddresses] = useState<AddressType[]>([])
  // Pagination for addresses
  const [addressesPage, setAddressesPage] = useState(1)
  const ADDRESSES_PAGE_SIZE = 4
  // Pagination for orders
  const [ordersPage, setOrdersPage] = useState(1)
  const ORDERS_PAGE_SIZE = 3

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userData = await fetchUserProfile()
        
        // Convert API data to Order format
        const userOrders: Order[] = userData.orders?.map((order: any) => ({
          id: order.id,
          date: new Date(order.createdAt).toISOString().split('T')[0],
          total: order.totalPrice,
          status: order.status === 'PENDING' ? 'Đang xử lý' : 
                  order.status === 'PROCESSING' ? 'Đang xử lý' :
                  order.status === 'PAID' ? 'Đã thanh toán' :
                  order.status === 'SHIPPING' ? 'Đang giao' :
                  order.status === 'SHIPPED' ? 'Đang giao' :
                  order.status === 'COMPLETED' ? 'Đã giao' :
                  order.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý',
          items: order.orderItems?.length || 0,
          ghnOrderCode: order.ghnOrderCode
        })) || []
        
        setOrders(userOrders)
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      }
    }

    if (!loading) {
      fetchOrders()
    }
  }, [loading])

  // Fetch GHN statuses for orders that have ghnOrderCode
  useEffect(() => {
    const controller = new AbortController()
    const fetchStatuses = async () => {
      try {
        const codes = Array.from(new Set(orders.map(o => (o.ghnOrderCode || "").trim().toUpperCase()).filter(Boolean))) as string[]
        if (codes.length === 0) return
        const statusMap: Record<string, string> = {}
        const logsMap: Record<string, Array<{ status: string; updated_date: string }>> = {}

        const toText = (status: string) => {
          const map: Record<string, string> = {
            ready_to_pick: "Sẵn sàng lấy hàng",
            picking: "Đang lấy hàng",
            picked: "Đã lấy hàng",
            storing: "Đang lưu kho",
            transporting: "Đang vận chuyển",
            sorting: "Đang phân loại",
            delivering: "Đang giao hàng",
            delivered: "Đã giao hàng",
            delivery_fail: "Giao hàng thất bại",
            waiting_to_return: "Chờ trả hàng",
            return: "Đang trả hàng",
            returned: "Đã trả hàng",
            exception: "Ngoại lệ",
            damage: "Hàng hóa bị hỏng",
            lost: "Hàng hóa bị mất",
            cancel: "Hủy đơn hàng",
          }
          return map[status] || status
        }

        await Promise.all(
          codes.map(async (code) => {
            try {
              const res = await api.get(`/shipping/detail/${code}`)
              // success helper wraps as { success, message, data }
              const envelope = res?.data ?? res
              const normalized = envelope?.data ?? envelope
              const current = normalized?.currentStatus || normalized?.status || null
              if (code && current) {
                statusMap[code] = toText(current)
              }
              const logsArr = Array.isArray(normalized?.log) ? normalized.log : []
              if (code && logsArr.length) {
                const sorted = logsArr
                  .slice()
                  .sort((a: any, b: any) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())
                logsMap[code] = sorted.map((l: any) => ({ status: l.status, updated_date: l.updated_date }))
              }
              // store debug snapshot
              setGhnDebug((prev) => ({ ...prev, [code]: { currentStatus: normalized?.currentStatus, status: normalized?.status, logs: logsArr.length } }))
            } catch (e) {
              // ignore errors per-order to keep UI resilient
            }
          })
        )
        if (!controller.signal.aborted && Object.keys(statusMap).length > 0) {
          setGhnStatuses((prev) => ({ ...prev, ...statusMap }))
        }
        if (!controller.signal.aborted && Object.keys(logsMap).length > 0) {
          setGhnLogs((prev) => ({ ...prev, ...logsMap }))
        }
      } catch {}
    }
    fetchStatuses()
    return () => controller.abort()
  }, [orders])

  // Poll GHN statuses periodically until terminal states
  useEffect(() => {
    const terminal = new Set(["delivered", "returned", "return", "cancel"]) // GHN terminal
    const codes = Array.from(new Set(orders.map(o => (o.ghnOrderCode || "").trim().toUpperCase()).filter(Boolean))) as string[]
    if (codes.length === 0) return

    let timer: any
    let aborted = false

    const poll = async () => {
      try {
        // If all codes are terminal in current map, stop polling
        const allTerminal = codes.every((code) => {
          const label = ghnStatuses[code]
          // convert back to key by a minimal reverse map (best-effort): if already delivered/returned/return/hủy → stop
          return label === "Đã giao hàng" || label === "Đã trả hàng" || label === "Hủy đơn hàng"
        })
        if (allTerminal) return

        const statusMap: Record<string, string> = {}
        const logsMap: Record<string, Array<{ status: string; updated_date: string }>> = {}
        const toText = (status: string) => {
          const map: Record<string, string> = {
            ready_to_pick: "Sẵn sàng lấy hàng",
            picking: "Đang lấy hàng",
            picked: "Đã lấy hàng",
            storing: "Đang lưu kho",
            transporting: "Đang vận chuyển",
            sorting: "Đang phân loại",
            delivering: "Đang giao hàng",
            delivered: "Đã giao hàng",
            delivery_fail: "Giao hàng thất bại",
            waiting_to_return: "Chờ trả hàng",
            return: "Đang trả hàng",
            returned: "Đã trả hàng",
            exception: "Ngoại lệ",
            damage: "Hàng hóa bị hỏng",
            lost: "Hàng hóa bị mất",
            cancel: "Hủy đơn hàng",
          }
          return map[status] || status
        }

        await Promise.all(
          codes.map(async (code) => {
            try {
              const res = await api.get(`/shipping/detail/${code}`)
              const envelope = res?.data ?? res
              const normalized = envelope?.data ?? envelope
              const current = normalized?.currentStatus || normalized?.status || null
              if (code && current) statusMap[code] = toText(current)
              const logsArr = Array.isArray(normalized?.log) ? normalized.log : []
              if (code && logsArr.length) {
                const sorted = logsArr
                  .slice()
                  .sort((a: any, b: any) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())
                logsMap[code] = sorted.map((l: any) => ({ status: l.status, updated_date: l.updated_date }))
              }
              setGhnDebug((prev) => ({ ...prev, [code]: { currentStatus: normalized?.currentStatus, status: normalized?.status, logs: logsArr.length } }))
            } catch {}
          })
        )
        if (!aborted && Object.keys(statusMap).length > 0) {
          setGhnStatuses((prev) => ({ ...prev, ...statusMap }))
        }
        if (!aborted && Object.keys(logsMap).length > 0) {
          setGhnLogs((prev) => ({ ...prev, ...logsMap }))
        }
      } finally {
        if (!aborted) timer = setTimeout(poll, 45000)
      }
    }
    poll()
    return () => {
      aborted = true
      if (timer) clearTimeout(timer)
    }
  }, [orders, ghnStatuses])

  // Fetch addresses from API
  useEffect(() => {
    const fetchAddressesData = async () => {
      try {
        const addressesData = await fetchAddresses()
        setAddresses(addressesData)
      } catch (error) {
        console.error('Error fetching addresses:', error)
        setAddresses([])
      }
    }

    if (!loading) {
      fetchAddressesData()
    }
  }, [loading])

  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)

  // GHN location states for Address Modal
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  // Address modal states
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressType | null>(null)
  const [addressFormData, setAddressFormData] = useState({
    name: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    provinceName: "",
    districtName: "",
    wardName: "",
    hamlet: "",
    isDefault: false
  })

  // Handle save address
  const handleSaveAddress = async () => {
    try {
      // derive names from IDs before saving
      const provinceName = provinces.find(p => p.ProvinceID.toString() === addressFormData.province)?.ProvinceName || addressFormData.provinceName || ""
      const districtName = districts.find(d => d.DistrictID.toString() === addressFormData.district)?.DistrictName || addressFormData.districtName || ""
      const wardName = wards.find(w => w.WardCode === addressFormData.ward)?.WardName || addressFormData.wardName || ""

      const payload = {
        ...addressFormData,
        provinceName,
        districtName,
        wardName,
      }

      if (editingAddress) {
        // Update existing
        await updateAddress(editingAddress.id, payload)
        setAddresses(addresses.map(a => a.id === editingAddress.id ? { ...a, ...payload } : a))
        toast.success("Cập nhật địa chỉ thành công")
      } else {
        // Create new
        await createAddress(payload)
        const newAddresses = await fetchAddresses()
        setAddresses(newAddresses)
        toast.success("Thêm địa chỉ thành công")
      }
      setShowAddressModal(false)
      setEditingAddress(null)
      setAddressFormData({
        name: "",
        phone: "",
        address: "",
        province: "",
        district: "",
        ward: "",
        provinceName: "",
        districtName: "",
        wardName: "",
        hamlet: "",
        isDefault: false
      })
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error("Có lỗi xảy ra khi lưu địa chỉ")
    }
  }

  // Handle set as default
  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId)
      const updatedAddresses = await fetchAddresses()
      setAddresses(updatedAddresses)
      toast.success("Đã đặt làm địa chỉ mặc định")
    } catch (error) {
      console.error('Error setting default address:', error)
      toast.error("Có lỗi xảy ra")
    }
  }

  // Handle edit address
  const handleEditAddress = (address: AddressType) => {
    setEditingAddress(address)
    setAddressFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      province: address.province || "",
      district: address.district || "",
      ward: address.ward || "",
      provinceName: address.provinceName || "",
      districtName: address.districtName || "",
      wardName: address.wardName || "",
      hamlet: address.hamlet || "",
      isDefault: address.isDefault
    })
    setShowAddressModal(true)
    setIsAddressModalOpen(true)
  }

  // Handle add new address
  const handleAddAddress = () => {
    setEditingAddress(null)
    setAddressFormData({
      name: "",
      phone: "",
      address: "",
      province: "",
      district: "",
      ward: "",
      provinceName: "",
      districtName: "",
      wardName: "",
      hamlet: "",
      isDefault: false
    })
    setShowAddressModal(true)
    setIsAddressModalOpen(true)
  }

  // Load provinces when modal opens
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true)
        const response = await api.get('/shipping/provinces')
        const provincesData = response.data?.data || response.data || []
        setProvinces(provincesData)
      } catch (error) {
        console.error('Error loading provinces:', error)
        toast.error('Không thể tải danh sách tỉnh/thành phố')
      } finally {
        setLoadingProvinces(false)
      }
    }
    if (showAddressModal) {
      loadProvinces()
    }
  }, [showAddressModal])

  // Load districts when province changes (in modal form)
  useEffect(() => {
    const loadDistricts = async (provinceId: string) => {
      try {
        const response = await api.get(`/shipping/districts/${provinceId}`)
        const districtsData = response.data?.data || response.data || []
        setDistricts(districtsData)
      } catch (error) {
        console.error('Error loading districts:', error)
        toast.error('Không thể tải danh sách quận/huyện')
      }
    }
    if (showAddressModal && addressFormData.province) {
      loadDistricts(addressFormData.province)
      // reset dependent fields when province changes
      setAddressFormData(prev => ({ ...prev, district: "", ward: "", districtName: "", wardName: "" }))
      setWards([])
    }
  }, [showAddressModal, addressFormData.province])

  // Load wards when district changes (in modal form)
  useEffect(() => {
    const loadWards = async (districtId: string) => {
      try {
        const response = await api.get(`/shipping/wards/${districtId}`)
        const wardsData = response.data?.data || response.data || []
        setWards(wardsData)
      } catch (error) {
        console.error('Error loading wards:', error)
        toast.error('Không thể tải danh sách phường/xã')
      }
    }
    if (showAddressModal && addressFormData.district) {
      loadWards(addressFormData.district)
      // reset ward when district changes
      setAddressFormData(prev => ({ ...prev, ward: "", wardName: "" }))
    }
  }, [showAddressModal, addressFormData.district])


  const handleViewOrderDetails = async (orderId: string) => {
    try {
      // Fetch order details from API
      const orderData = await api.get(`/orders/${orderId}`)
      const od = (orderData && (orderData.data || orderData)) as any
      
      // Calculate subtotal (total price - shipping fee)
      const shippingFee = od?.shippingFee || 0
      const subtotal = (od?.totalPrice || 0) - shippingFee
      
      const createdAt = od?.createdAt ? new Date(od.createdAt) : null
      const createdDateStr = createdAt && !isNaN(createdAt.getTime()) ? createdAt.toISOString().split('T')[0] : ''
      const updatedAt = od?.updatedAt ? new Date(od.updatedAt) : null
      const updatedAtStr = updatedAt && !isNaN(updatedAt.getTime()) ? updatedAt.toLocaleString('vi-VN') : ''
      
      let orderDetail: OrderDetail = {
        id: od.id,
        date: createdDateStr,
        status: od.status === 'PENDING' ? 'Đang xử lý' : 
                od.status === 'PROCESSING' ? 'Đang xử lý' :
                od.status === 'PAID' ? 'Đã thanh toán' :
                od.status === 'SHIPPING' ? 'Đang giao' :
                od.status === 'SHIPPED' ? 'Đang giao' :
                od.status === 'COMPLETED' ? 'Đã giao' :
                od.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý',
        items: od.orderItems?.map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          image: item.product.image,
          price: item.product.price,
          quantity: item.quantity,
        })) || [],
        subtotal: subtotal,
        shipping: shippingFee,
        total: od.totalPrice || 0,
        shippingAddress: {
          name: od.shippingName || profile.name || "Chưa có tên",
          phone: od.shippingPhone || profile.phone || "Chưa có SĐT",
          address: od.shippingAddress || "Chưa có địa chỉ",
          province: od.shippingProvince,
          district: od.shippingDistrict,
          ward: od.shippingWard,
        },
        paymentMethod: od.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 
                       od.paymentMethod === 'PAYPAL' ? 'PayPal' : 'Thanh toán khi nhận hàng',
        ghnOrderCode: od.ghnOrderCode,
        timeline: [],
      }

      // If GHN code exists, fetch GHN detail to build accurate timeline from logs
      const codeUpper = (od.ghnOrderCode || "").trim().toUpperCase()
      if (codeUpper) {
        try {
          const res = await api.get(`/shipping/detail/${codeUpper}`)
          const envelope = res?.data ?? res
          const normalized = envelope?.data ?? envelope
          const logsArr = Array.isArray(normalized?.log) ? normalized.log : []
          const latestTs = (() => {
            if (logsArr.length) {
              const latest = logsArr
                .slice()
                .sort((a: any, b: any) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())[0]
              return latest?.updated_date
            }
            return normalized?.latestLog?.updated_date || normalized?.updated_date || normalized?.created_date || null
          })()

          // Always base label on DB status, but use timestamp from GHN if available
          const dbLabel = od.status === 'PENDING' ? 'Đang xử lý' : 
                          od.status === 'PROCESSING' ? 'Đang xử lý' :
                          od.status === 'PAID' ? 'Đã thanh toán' :
                          od.status === 'SHIPPING' ? 'Đang giao' :
                          od.status === 'SHIPPED' ? 'Đang giao' :
                          od.status === 'COMPLETED' ? 'Đã giao' :
                          od.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý'

          orderDetail.timeline = [
            {
              status: dbLabel,
              date: latestTs ? new Date(latestTs).toLocaleString('vi-VN') : (updatedAtStr || new Date().toLocaleString('vi-VN')),
              description: "Cập nhật trạng thái đơn hàng",
            },
            {
              status: "Đã đặt",
              date: createdAt && !isNaN(createdAt.getTime()) ? createdAt.toLocaleString('vi-VN') : '',
              description: "Đơn hàng đã được đặt thành công",
            },
          ]
        } catch {}

        // Fallback: if fetch failed, still show DB status with last updatedAt
        if (!orderDetail.timeline.length) {
          const dbLabel = od.status === 'PENDING' ? 'Đang xử lý' : 
                          od.status === 'PROCESSING' ? 'Đang xử lý' :
                          od.status === 'PAID' ? 'Đã thanh toán' :
                          od.status === 'SHIPPING' ? 'Đang giao' :
                          od.status === 'SHIPPED' ? 'Đang giao' :
                          od.status === 'COMPLETED' ? 'Đã giao' :
                          od.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý'
          orderDetail.timeline = [
            { status: dbLabel, date: updatedAtStr, description: "Cập nhật trạng thái đơn hàng" },
            { status: "Đã đặt", date: createdAt && !isNaN(createdAt.getTime()) ? createdAt.toLocaleString('vi-VN') : '', description: "Đơn hàng đã được đặt thành công" },
          ]
        }
      }

      // Fallback timeline if GHN logs not available
      if (!orderDetail.timeline.length) {
        orderDetail.timeline = [
          { 
            status: od.status === 'PENDING' ? 'Đang xử lý' : 
                    od.status === 'PAID' ? 'Đã thanh toán' :
                    od.status === 'SHIPPED' ? 'Đang giao' :
                    od.status === 'COMPLETED' ? 'Đã giao' : (codeUpper ? 'Đang cập nhật từ GHN' : 'Đã hủy'), 
            date: updatedAtStr, 
            description: "Cập nhật trạng thái đơn hàng" 
          },
          { 
            status: "Đã đặt", 
            date: createdAt && !isNaN(createdAt.getTime()) ? createdAt.toLocaleString('vi-VN') : '', 
            description: "Đơn hàng đã được đặt thành công" 
          },
        ]
      }

      setSelectedOrder(orderDetail)
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Helpers for date formatting
  const toDateInputValue = (val?: string) => {
    const v = (val || "").trim()
    if (!v) return ""
    // If already yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
    // If dd/mm/yyyy -> convert to yyyy-mm-dd
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    // Fallback: try Date parse
    const d = new Date(v)
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
    return ""
  }

  const refreshGHNStatus = async (code?: string | null) => {
    try {
      const c = (code || "").trim().toUpperCase()
      if (!c) return
      const res = await api.get(`/shipping/detail/${c}`)
      const envelope = res?.data ?? res
      const normalized = envelope?.data ?? envelope
      const toText = (status: string) => {
        const map: Record<string, string> = {
          ready_to_pick: "Sẵn sàng lấy hàng",
          picking: "Đang lấy hàng",
          picked: "Đã lấy hàng",
          storing: "Đang lưu kho",
          transporting: "Đang vận chuyển",
          sorting: "Đang phân loại",
          delivering: "Đang giao hàng",
          delivered: "Đã giao hàng",
          delivery_fail: "Giao hàng thất bại",
          waiting_to_return: "Chờ trả hàng",
          return: "Đang trả hàng",
          returned: "Đã trả hàng",
          exception: "Ngoại lệ",
          damage: "Hàng hóa bị hỏng",
          lost: "Hàng hóa bị mất",
          cancel: "Hủy đơn hàng",
        }
        return map[status] || status
      }
      const current = normalized?.currentStatus || normalized?.status || null
      if (current) setGhnStatuses((prev) => ({ ...prev, [c]: toText(current) }))
      const logsArr = Array.isArray(normalized?.log) ? normalized.log : []
      if (logsArr.length) {
        const sorted = logsArr
          .slice()
          .sort((a: any, b: any) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())
        setGhnLogs((prev) => ({ ...prev, [c]: sorted.map((l: any) => ({ status: l.status, updated_date: l.updated_date })) }))
      }
      // snapshot for debug
      setGhnDebug((prev) => ({ ...prev, [c]: { currentStatus: normalized?.currentStatus, status: normalized?.status, logs: logsArr.length } }))
    } catch (e) {
      console.error('[GHN][UI] refresh error', code, e)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveError("")
      
      // Update profile via API
      const updatedUser = await updateUserProfile({
        name: editedProfile.name,
        phone: editedProfile.phone,
        birthDate: editedProfile.birthDate,
        gender: editedProfile.gender,
      })
      const u = (updatedUser as any)?.data ?? updatedUser
      setProfile({
        name: u?.name || "",
        email: u?.email || "",
        phone: u?.phone || "",
        birthDate: (u as any)?.birthDate || editedProfile.birthDate || "",
        gender: (u as any)?.gender || editedProfile.gender,
      })
      setEditedProfile({
        name: u?.name || "",
        email: u?.email || profile.email || "",
        phone: u?.phone || "",
        birthDate: (u as any)?.birthDate || editedProfile.birthDate || "",
        gender: (u as any)?.gender || editedProfile.gender,
      })
      setIsEditing(false)
    } catch (e) {
      setSaveError("Cập nhật thất bại")
      console.error('Error updating profile:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return
    }
    
    try {
      await cancelUserOrder(orderId)
      alert('Đơn hàng đã được hủy thành công!')
      // Refresh orders
      const userData = await fetchUserProfile()
      const userOrders: Order[] = userData.orders?.map((order: any) => ({
        id: order.id,
        date: new Date(order.createdAt).toISOString().split('T')[0],
        total: order.totalPrice,
        status: order.status === 'PENDING' ? 'Đang xử lý' : 
                order.status === 'PAID' ? 'Đã thanh toán' :
                order.status === 'SHIPPED' ? 'Đang giao' :
                order.status === 'COMPLETED' ? 'Đã giao' : 'Đã hủy',
        items: order.orderItems?.length || 0,
        ghnOrderCode: order.ghnOrderCode
      })) || []
      setOrders(userOrders)
    } catch (error: any) {
      console.error('Error canceling order:', error)
      alert(`Lỗi khi hủy đơn hàng: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đã giao":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Đang giao":
      case "Đang giao hàng":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Đang xử lý":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "Đã thanh toán":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "Đã hủy":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
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
                <h2 className="text-2xl font-bold text-foreground">Chi tiết đơn hàng #{selectedOrder.ghnOrderCode || selectedOrder.id}</h2>
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
              {/* Order Status (prefer GHN status if available) */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Trạng thái đơn hàng</span>
                  {(() => {
                    const codeUpper = (selectedOrder.ghnOrderCode || "").trim().toUpperCase();
                    const snap = codeUpper ? ghnDebug[codeUpper] : undefined as any;
                    const labelFromSnap = snap?.currentStatus ? (() => {
                      const map: Record<string, string> = {
                        ready_to_pick: "Sẵn sàng lấy hàng",
                        picking: "Đang lấy hàng",
                        picked: "Đã lấy hàng",
                        storing: "Đang lưu kho",
                        transporting: "Đang vận chuyển",
                        sorting: "Đang phân loại",
                        delivering: "Đang giao hàng",
                        delivered: "Đã giao hàng",
                        delivery_fail: "Giao hàng thất bại",
                        waiting_to_return: "Chờ trả hàng",
                        return: "Đang trả hàng",
                        returned: "Đã trả hàng",
                        exception: "Ngoại lệ",
                        damage: "Hàng hóa bị hỏng",
                        lost: "Hàng hóa bị mất",
                        cancel: "Hủy đơn hàng",
                      }
                      return map[snap.currentStatus as string] || snap.currentStatus
                    })() : undefined
                    const labelFromState = codeUpper && ghnStatuses[codeUpper] ? ghnStatuses[codeUpper] : undefined
                    const displayStatus = labelFromSnap || labelFromState || selectedOrder.status
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(displayStatus)}`}>
                        {displayStatus}
                      </span>
                    )
                  })()}
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
                  <p className="text-sm text-foreground mt-1">
                    {[
                      selectedOrder.shippingAddress.ward,
                      selectedOrder.shippingAddress.district,
                      selectedOrder.shippingAddress.province
                    ].filter(Boolean).join(", ")}
                  </p>
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
                  <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{selectedOrder.total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Đóng
                </button>
                {selectedOrder.status === 'Đang xử lý' && (
                  <button
                    onClick={() => {
                      handleCancelOrder(selectedOrder.id)
                      setSelectedOrder(null)
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Hủy đơn hàng
                  </button>
                )}
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
                {/* Payment tab removed */}
                
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
                  <h3 className="text-xl font-bold text-foreground">Thông tin tài khoản</h3>
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
                      value={profile.email}
                      disabled={true}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>
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
                    <label className="block text-sm font-medium text-foreground mb-2">Ngày sinh</label>
                    <input
                      type="date"
                      value={isEditing ? toDateInputValue(editedProfile.birthDate) : toDateInputValue(profile.birthDate)}
                      onChange={(e) => setEditedProfile({ ...editedProfile, birthDate: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Giới tính</label>
                    <div className="flex items-center gap-6">
                      {(["Nam", "Nữ", "Khác"] as const).map((g) => (
                        <label key={`gender-${g}`} className="flex items-center gap-2 text-foreground">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={(isEditing ? editedProfile.gender : profile.gender) === g}
                            onChange={() => isEditing && setEditedProfile({ ...editedProfile, gender: g })}
                            disabled={!isEditing}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Lịch sử đơn hàng</h3>

                {/* Phân trang danh sách đơn hàng */}
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PAGE_SIZE))
                  const currentPage = Math.min(ordersPage, totalPages)
                  const start = (currentPage - 1) * ORDERS_PAGE_SIZE
                  const end = start + ORDERS_PAGE_SIZE
                  const pageOrders = orders.slice(start, end)
                  return (
                    <>
                <div className="space-y-4">
                  {pageOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            Đơn hàng #{order.ghnOrderCode || order.id}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                        {(() => {
                          const codeUpper = (order.ghnOrderCode || "").trim().toUpperCase()
                          const snap = ghnDebug[codeUpper]
                          const labelFromSnap = snap?.currentStatus ? (() => {
                            const map: Record<string, string> = {
                              ready_to_pick: "Sẵn sàng lấy hàng",
                              picking: "Đang lấy hàng",
                              picked: "Đã lấy hàng",
                              storing: "Đang lưu kho",
                              transporting: "Đang vận chuyển",
                              sorting: "Đang phân loại",
                              delivering: "Đang giao hàng",
                              delivered: "Đã giao hàng",
                              delivery_fail: "Giao hàng thất bại",
                              waiting_to_return: "Chờ trả hàng",
                              return: "Đang trả hàng",
                              returned: "Đã trả hàng",
                              exception: "Ngoại lệ",
                              damage: "Hàng hóa bị hỏng",
                              lost: "Hàng hóa bị mất",
                              cancel: "Hủy đơn hàng",
                            }
                            return map[snap.currentStatus as string] || snap.currentStatus
                          })() : undefined
                          const labelFromState = codeUpper && ghnStatuses[codeUpper] ? ghnStatuses[codeUpper] : undefined
                          const displayStatus = labelFromSnap || labelFromState || order.status
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
                              {displayStatus}
                            </span>
                          )
                        })()}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">{order.items} sản phẩm</div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{order.total.toLocaleString("vi-VN")}₫</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleViewOrderDetails(order.id)}
                              className="text-sm text-primary hover:underline"
                            >
                              Xem chi tiết
                            </button>
                            {/* Removed manual GHN refresh button; statuses auto-sync from GHN */}
                            {(order.status === 'Đang xử lý') && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-sm text-red-500 hover:underline"
                              >
                                Hủy đơn hàng
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hidden GHN logs and debug info in order history UI */}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded border border-border text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'}`}
                  >
                    Trang trước
                  </button>
                  <div className="text-sm text-muted-foreground">
                    Trang <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}
                  </div>
                  <button
                    onClick={() => setOrdersPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded border border-border text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'}`}
                  >
                    Trang sau
                  </button>
                </div>
                    </>
                  )
                })()}
              </div>
            )}

            {/* Address Modal */}
            {showAddressModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">
                      {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowAddressModal(false)
                        setEditingAddress(null)
                      }}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6 text-foreground" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="addr-name">Họ và tên *</Label>
                        <Input
                          id="addr-name"
                          value={addressFormData.name}
                          onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="addr-phone">Số điện thoại *</Label>
                        <Input
                          id="addr-phone"
                          value={addressFormData.phone}
                          onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                          placeholder="Nhập số điện thoại"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="addr-address">Địa chỉ chi tiết *</Label>
                      <Input
                        id="addr-address"
                        value={addressFormData.address}
                        onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
                        placeholder="Số nhà, tên đường..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Tỉnh/Thành phố *</Label>
                        <Select
                          value={addressFormData.province || ""}
                          onValueChange={(value) => setAddressFormData({ ...addressFormData, province: value })}
                          disabled={loadingProvinces}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tỉnh/thành phố" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={`prov-${province.ProvinceID}`} value={province.ProvinceID.toString()}>
                                {province.ProvinceName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quận/Huyện *</Label>
                        <Select
                          value={addressFormData.district || ""}
                          onValueChange={(value) => setAddressFormData({ ...addressFormData, district: value })}
                          disabled={!addressFormData.province || districts.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn quận/huyện" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((district) => (
                              <SelectItem key={`dist-${district.DistrictID}`} value={district.DistrictID.toString()}>
                                {district.DistrictName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Phường/Xã *</Label>
                        <Select
                          value={addressFormData.ward || ""}
                          onValueChange={(value) => setAddressFormData({ ...addressFormData, ward: value })}
                          disabled={!addressFormData.district || wards.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn phường/xã" />
                          </SelectTrigger>
                          <SelectContent>
                            {wards.map((ward) => (
                              <SelectItem key={`ward-${ward.WardCode}`} value={ward.WardCode}>
                                {ward.WardName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Thôn/Ấp</Label>
                      <Input
                        value={addressFormData.hamlet}
                        onChange={(e) => setAddressFormData({ ...addressFormData, hamlet: e.target.value })}
                        placeholder="Nhập thôn/ấp (không bắt buộc)"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-default-addr"
                        checked={addressFormData.isDefault}
                        onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="is-default-addr" className="cursor-pointer">
                        Đặt làm địa chỉ mặc định
                      </Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <button
                        onClick={() => {
                          setShowAddressModal(false)
                          setEditingAddress(null)
                        }}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-foreground"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveAddress}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Địa chỉ giao hàng</h3>
                  <button 
                    onClick={handleAddAddress}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Thêm địa chỉ
                  </button>
                </div>

                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>💡 Mẹo:</strong> Bạn có thể lưu địa chỉ khi đặt hàng bằng cách tích chọn "Lưu địa chỉ này cho lần sau" ở trang thanh toán, hoặc nhấn nút "Thêm địa chỉ" ở trên.
                  </p>
                </div>

                {addresses.length > 0 ? (() => {
                  const totalPages = Math.max(1, Math.ceil(addresses.length / ADDRESSES_PAGE_SIZE))
                  const currentPage = Math.min(addressesPage, totalPages)
                  const start = (currentPage - 1) * ADDRESSES_PAGE_SIZE
                  const end = start + ADDRESSES_PAGE_SIZE
                  const pageAddresses = addresses.slice(start, end)
                  return (
                  <>
                  <div className="space-y-4">
                    {pageAddresses.map((address) => (
                      <div key={address.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
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
                              {address.address}
                              {address.wardName && `, ${address.wardName}`}
                              {address.districtName && `, ${address.districtName}`}
                              {address.provinceName && `, ${address.provinceName}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!address.isDefault && (
                              <button 
                                className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                onClick={() => handleSetDefault(address.id)}
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                            <button 
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              onClick={() => handleEditAddress(address)}
                            >
                              <PencilIcon className="w-4 h-4 text-foreground" />
                            </button>
                            <button 
                              className="p-2 hover:bg-secondary rounded-lg transition-colors text-red-500"
                              onClick={async () => {
                                if (confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
                                  try {
                                    await deleteAddress(address.id)
                                    setAddresses(addresses.filter(a => a.id !== address.id))
                                    toast.success("Đã xóa địa chỉ")
                                  } catch (error) {
                                    console.error('Error deleting address:', error)
                                    toast.error("Có lỗi xảy ra khi xóa địa chỉ")
                                  }
                                }
                              }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setAddressesPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded border border-border text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'}`}
                    >
                      Trang trước
                    </button>
                    <div className="text-sm text-muted-foreground">
                      Trang <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}
                    </div>
                    <button
                      onClick={() => setAddressesPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded border border-border text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'}`}
                    >
                      Trang sau
                    </button>
                  </div>
                  </>
                  )
                })() : (
                  <div className="text-center py-12">
                    <MapPinIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Chưa có địa chỉ giao hàng</p>
                    <p className="text-sm text-muted-foreground">Thêm địa chỉ mới để đơn giản hóa việc đặt hàng</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment tab content removed */}
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
