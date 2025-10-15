"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category?: any
  onSave: (data: any) => void
}

export default function CategoryModal({ isOpen, onClose, category, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "📦",
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
      })
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        icon: "📦",
      })
    }
  }, [category, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    })
  }

  const iconOptions = ["📱", "💻", "📲", "🎧", "⌚", "📷", "🎮", "🖥️", "⌨️", "🖱️", "🔋", "📦"]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tên danh mục</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug (URL)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Tự động tạo từ tên danh mục</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-3 text-2xl rounded-lg border-2 transition-colors ${
                    formData.icon === icon
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {category ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
