"use client"

import { useState } from "react"
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from "@heroicons/react/24/outline"
import CategoryModal from "@/components/admin/CategoryModal"

const initialCategories = [
  {
    id: "dien-thoai",
    name: "Điện thoại",
    slug: "dien-thoai",
    description: "Smartphone và điện thoại di động",
    productCount: 3,
    icon: "📱",
  },
  {
    id: "laptop",
    name: "Laptop",
    slug: "laptop",
    description: "Máy tính xách tay và ultrabook",
    productCount: 2,
    icon: "💻",
  },
  {
    id: "tablet",
    name: "Tablet",
    slug: "tablet",
    description: "Máy tính bảng và iPad",
    productCount: 2,
    icon: "📲",
  },
  {
    id: "phu-kien",
    name: "Phụ kiện",
    slug: "phu-kien",
    description: "Tai nghe, chuột, bàn phím và phụ kiện khác",
    productCount: 5,
    icon: "🎧",
  },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = (categoryId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      setCategories(categories.filter((cat) => cat.id !== categoryId))
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleSave = (categoryData: any) => {
    if (editingCategory) {
      setCategories(categories.map((cat) => (cat.id === editingCategory.id ? { ...cat, ...categoryData } : cat)))
    } else {
      const newCategory = {
        id: categoryData.slug,
        ...categoryData,
        productCount: 0,
      }
      setCategories([...categories, newCategory])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý danh mục</h1>
          <p className="text-muted-foreground mt-1">Quản lý các danh mục sản phẩm trong cửa hàng</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm danh mục
        </button>
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
                {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Danh mục phổ biến</p>
              <p className="text-lg font-bold text-foreground">
                {categories.reduce((max, cat) => (cat.productCount > max.productCount ? cat : max)).name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                {category.icon}
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
            <p className="text-sm text-muted-foreground mb-4">{category.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Sản phẩm</span>
              <span className="text-sm font-medium text-foreground">{category.productCount}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        onSave={handleSave}
      />
    </div>
  )
}
