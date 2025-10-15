"use client"

import { useState } from "react"
import { MagnifyingGlassIcon, UserPlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import UserModal from "@/components/admin/UserModal"

const initialUsers = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    role: "customer",
    status: "active",
    orders: 12,
    totalSpent: 45000000,
    joinedDate: "2024-01-15",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0912345678",
    role: "customer",
    status: "active",
    orders: 8,
    totalSpent: 28000000,
    joinedDate: "2024-02-20",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "Lê Văn C",
    email: "levanc@example.com",
    phone: "0923456789",
    role: "admin",
    status: "active",
    orders: 0,
    totalSpent: 0,
    joinedDate: "2023-12-01",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "4",
    name: "Phạm Thị D",
    email: "phamthid@example.com",
    phone: "0934567890",
    role: "customer",
    status: "inactive",
    orders: 3,
    totalSpent: 12000000,
    joinedDate: "2024-03-10",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "5",
    name: "Hoàng Văn E",
    email: "hoangvane@example.com",
    phone: "0945678901",
    role: "staff",
    status: "active",
    orders: 0,
    totalSpent: 0,
    joinedDate: "2024-01-05",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = (userId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  const handleAddNew = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleSave = (userData: any) => {
    if (editingUser) {
      setUsers(users.map((user) => (user.id === editingUser.id ? { ...user, ...userData } : user)))
    } else {
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        orders: 0,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split("T")[0],
        avatar: "/placeholder.svg?height=40&width=40",
      }
      setUsers([...users, newUser])
    }
  }

  const roleConfig = {
    admin: { label: "Quản trị viên", color: "bg-red-500/10 text-red-500" },
    staff: { label: "Nhân viên", color: "bg-blue-500/10 text-blue-500" },
    customer: { label: "Khách hàng", color: "bg-green-500/10 text-green-500" },
  }

  const statusConfig = {
    active: { label: "Hoạt động", color: "bg-green-500/10 text-green-500" },
    inactive: { label: "Không hoạt động", color: "bg-gray-500/10 text-gray-500" },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-1">Quản lý tài khoản người dùng và phân quyền</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlusIcon className="w-5 h-5" />
          Thêm người dùng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Tổng người dùng</p>
          <p className="text-2xl font-bold text-foreground mt-2">{users.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Khách hàng</p>
          <p className="text-2xl font-bold text-foreground mt-2">{users.filter((u) => u.role === "customer").length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Nhân viên</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {users.filter((u) => u.role === "staff" || u.role === "admin").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Đang hoạt động</p>
          <p className="text-2xl font-bold text-foreground mt-2">{users.filter((u) => u.status === "active").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="staff">Nhân viên</option>
            <option value="customer">Khách hàng</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tổng chi tiêu
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        className="w-10 h-10 rounded-full bg-muted"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          {user.name}
                          {user.role === "admin" && <ShieldCheckIcon className="w-4 h-4 text-red-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground">Tham gia: {user.joinedDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig[user.role as keyof typeof roleConfig].color}`}
                    >
                      {roleConfig[user.role as keyof typeof roleConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[user.status as keyof typeof statusConfig].color}`}
                    >
                      {statusConfig[user.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{user.orders}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">
                      {user.totalSpent.toLocaleString("vi-VN")}₫
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>

      {/* User Modal */}
      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={editingUser} onSave={handleSave} />
    </div>
  )
}
