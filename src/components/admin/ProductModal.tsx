"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct, updateProduct, fetchCategories, uploadImage, type AdminProduct, type ApiCategory } from "@/lib/api"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: AdminProduct | null
  categories?: ApiCategory[]
}

interface SpecValue {
  specFieldId: string
  value: string
}

export default function ProductModal({ isOpen, onClose, product, categories: categoriesProp }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
    description: "",
    image: "",
    inStock: true,
    stock: "",
  })
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [specValues, setSpecValues] = useState<SpecValue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    if (categoriesProp && categoriesProp.length > 0) {
      setCategories(categoriesProp)
    } else {
      loadCategories()
    }
  }, [isOpen, categoriesProp])

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        categoryId: (product as any).categoryId || product.category?.id || "",
        description: product.description || "",
        image: product.image || "",
        inStock: product.inStock,
        stock: (product as any).stock?.toString?.() || (product.inStock ? "1" : "0"),
      })
      // Load existing specs
      setSpecValues(product.specs?.map(spec => ({
        specFieldId: spec.specField.id,
        value: spec.value
      })) || [])
    } else {
      setFormData({
        name: "",
        price: "",
        categoryId: "",
        description: "",
        image: "",
        inStock: true,
        stock: "",
      })
      setSpecValues([])
    }
    setError("")
  }, [product, isOpen])

  // Ensure categoryId reflects existing product once categories are loaded
  useEffect(() => {
    if (!isOpen || !product) return
    // Keep categoryId in sync when category list loads; prefer raw categoryId if present
    setFormData(prev => ({ ...prev, categoryId: (product as any).categoryId || product.category?.id || "" }))
  }, [categories, isOpen, product])

  const loadCategories = async () => {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      console.error("Failed to load categories:", err)
    }
  }

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.categoryId)
  }

  const updateSpecValue = (specFieldId: string, value: string) => {
    setSpecValues(prev => {
      const existing = prev.find(spec => spec.specFieldId === specFieldId)
      if (existing) {
        return prev.map(spec => 
          spec.specFieldId === specFieldId ? { ...spec, value } : spec
        )
      } else {
        return [...prev, { specFieldId, value }]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        specs: specValues.filter(spec => spec.value.trim()).map(spec => ({
          specFieldId: spec.specFieldId,
          value: spec.value
        }))
      }

      if (product) {
        await updateProduct(product.id, productData)
      } else {
        await createProduct(productData)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Thông tin cơ bản</h3>
            
            <div>
              <Label htmlFor="name">Tên sản phẩm *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Giá bán (₫) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Danh mục *</Label>
              <Select
                key={formData.categoryId || 'cat-select'}
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.categoryId ? (categories.find(c => c.id === formData.categoryId)?.name || 'Chọn danh mục') : 'Chọn danh mục'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Hình ảnh</Label>
              {formData.image && (
                <div className="flex items-center gap-3">
                  <img src={formData.image} alt="preview" className="w-16 h-16 rounded object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: "" })}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="URL hình ảnh"
                />
                <label className="px-3 py-2 border border-border rounded bg-muted hover:bg-muted/80 cursor-pointer text-sm">
                  Tải ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const inputEl = e.currentTarget
                      const file = inputEl.files?.[0]
                      if (!file) return
                      try {
                        setLoading(true)
                        const url = await uploadImage(file)
                        setFormData({ ...formData, image: url })
                      } catch (err) {
                        setError("Tải ảnh thất bại")
                      } finally {
                        setLoading(false)
                        if (inputEl) inputEl.value = ''
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả sản phẩm"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trạng thái</Label>
                <Select
                  value={formData.inStock ? "true" : "false"}
                  onValueChange={(value) => setFormData({ ...formData, inStock: value === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Còn hàng</SelectItem>
                    <SelectItem value="false">Hết hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số lượng (nếu còn hàng)</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Ví dụ: 10"
                  disabled={!formData.inStock}
                />
              </div>
            </div>
          </div>

          {/* Spec Fields */}
          {getSelectedCategory()?.specFields && getSelectedCategory()!.specFields!.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Thông số kỹ thuật</h3>
              <p className="text-sm text-muted-foreground">
                Điền thông số kỹ thuật cho sản phẩm theo danh mục đã chọn
              </p>
              
              <div className="space-y-3">
                {getSelectedCategory()!.specFields!.map((specField, index) => (
                  <div key={specField.id || index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        {specField.name}
                        {specField.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={specValues.find(spec => spec.specFieldId === specField.id)?.value || ""}
                        onChange={(e) => specField.id && updateSpecValue(specField.id, e.target.value)}
                        placeholder={`Nhập ${specField.name.toLowerCase()}`}
                        required={specField.required}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.categoryId}
            >
              {loading ? "Đang lưu..." : product ? "Cập nhật" : "Tạo sản phẩm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
