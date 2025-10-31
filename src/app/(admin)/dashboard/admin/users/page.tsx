"use client"

import { useState, useEffect } from "react"
import { MagnifyingGlassIcon, UserPlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import UserModal from "@/components/admin/UserModal"
import { fetchAdminUsers, updateUser, deleteUser, type AdminUser } from "@/lib/api"

type User = AdminUser

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch users from API
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetchAdminUsers()
      setUsers(response.users || [])
    } catch (err) {
      setError('Không thể tải danh sách người dùng')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        await deleteUser(userId)
        setUsers(users.filter((user) => user.id !== userId))
      } catch (err) {
        setError('Không thể xóa người dùng')
        console.error('Error deleting user:', err)
      }
    }
  }

  const handleAddNew = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleSave = async (userData: any) => {
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await updateUser(editingUser.id, userData)
        setUsers(users.map((user) => (user.id === editingUser.id ? updatedUser : user)))
      } else {
        // Create new user - this would need to be implemented in backend
        setError('Chức năng tạo người dùng mới chưa được triển khai')
        return
      }
      setIsModalOpen(false)
    } catch (err) {
      setError('Không thể lưu thông tin người dùng')
      console.error('Error saving user:', err)
    }
  }

  const roleConfig = {
    ADMIN: { label: "Quản trị viên", color: "bg-red-500/10 text-red-500" },
    CUSTOMER: { label: "Khách hàng", color: "bg-green-500/10 text-green-500" },
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}


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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Tổng người dùng</p>
          <p className="text-2xl font-bold text-foreground mt-2">{users.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Khách hàng</p>
          <p className="text-2xl font-bold text-foreground mt-2">{users.filter((u) => u.role === "CUSTOMER").length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Quản trị viên</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {users.filter((u) => u.role === "ADMIN").length}
          </p>
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
            <option value="ADMIN">Quản trị viên</option>
            <option value="CUSTOMER">Khách hàng</option>
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
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tổng chi tiêu (đã hoàn thành)
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
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-medium text-muted-foreground">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          {user.name || "Chưa có tên"}
                          {user.role === "ADMIN" && <ShieldCheckIcon className="w-4 h-4 text-red-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground">Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.phone || "Chưa có SĐT"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig[user.role as keyof typeof roleConfig].color}`}
                    >
                      {roleConfig[user.role as keyof typeof roleConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{user._count?.orders || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">
                      {user.orders?.reduce((total, order) => total + order.totalPrice, 0).toLocaleString('vi-VN')}₫
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


