"use client"

import { useState, useEffect } from "react"
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import CategoryModal from "@/components/admin/CategoryModal"
import { 
  fetchAdminCategories, 
  deleteCategory, 
  type AdminCategory 
} from "@/lib/api"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [searchQuery])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchAdminCategories({
        search: searchQuery || undefined
      })
      setCategories(data.categories)
    } catch (err) {
      setError("Không thể tải dữ liệu danh mục")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await deleteCategory(categoryId)
        await loadData() // Reload data
      } catch (err) {
        alert("Không thể xóa danh mục. Có thể danh mục này đang có sản phẩm.")
      }
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    loadData() // Reload data after modal closes
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý danh mục</h1>
          <p className="text-muted-foreground mt-1">Quản lý các danh mục sản phẩm và thông số kỹ thuật</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm danh mục
        </button>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TagIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng danh mục</p>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-foreground">
                {categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Thông số kỹ thuật</p>
              <p className="text-2xl font-bold text-foreground">
                {categories.reduce((sum, cat) => sum + (cat.specFields?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải danh mục...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy danh mục nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
          <div
            key={category.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-8 h-8 rounded object-cover" />
                ) : (
                  <TagIcon className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">{category.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{category.description || "Không có mô tả"}</p>

            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sản phẩm</span>
                <span className="text-sm font-medium text-foreground">{category.products?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Thông số kỹ thuật</span>
                <span className="text-sm font-medium text-foreground">{category.specFields?.length || 0}</span>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        category={editingCategory}
      />
    </div>
  )
}
