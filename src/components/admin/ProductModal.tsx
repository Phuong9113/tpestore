"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: any
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    category: "Điện thoại",
    description: "",
    inStock: true,
    rating: 5,
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || "",
        category: product.category,
        description: product.description,
        inStock: product.inStock,
        rating: product.rating,
      })
    } else {
      setFormData({
        name: "",
        price: "",
        originalPrice: "",
        category: "Điện thoại",
        description: "",
        inStock: true,
        rating: 5,
      })
    }
  }, [product, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Save product:", formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
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
            <label className="block text-sm font-medium text-foreground mb-2">Tên sản phẩm</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Giá bán (₫)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Giá gốc (₫)</label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Danh mục</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Điện thoại</option>
              <option>Laptop</option>
              <option>Tablet</option>
              <option>Phụ kiện</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Mô tả ngắn</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Trạng thái</label>
              <select
                value={formData.inStock ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.value === "true" })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="true">Còn hàng</option>
                <option value="false">Hết hàng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Đánh giá</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number.parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
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
              {product ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
