"use client"

import { useState, useEffect } from "react"
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCategory, updateCategory, type AdminCategory } from "@/lib/api"

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category?: AdminCategory | null
}

interface SpecField {
  id?: string
  name: string
  type: string
  required: boolean
}

const SPEC_TYPES = [
  { value: "TEXT", label: "Văn bản" },
  { value: "NUMBER", label: "Số" },
  { value: "BOOLEAN", label: "Có/Không" },
  { value: "SELECT", label: "Lựa chọn" },
  { value: "MULTI_SELECT", label: "Nhiều lựa chọn" },
]

export default function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [specFields, setSpecFields] = useState<SpecField[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        image: category.image || "",
      })
      setSpecFields(category.specFields || [])
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
      })
      setSpecFields([])
    }
    setError("")
  }, [category, isOpen])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch('http://localhost:4000/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload image')
    }
    
    const data = await response.json()
    return `http://localhost:4000${data.url}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let imageUrl = formData.image
      
      // Upload image if new file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const categoryData = {
        ...formData,
        image: imageUrl,
        specFields: specFields.map(field => ({
          name: field.name,
          type: field.type,
          required: field.required
        }))
      }

      if (category) {
        await updateCategory(category.id, categoryData)
      } else {
        await createCategory(categoryData)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  const addSpecField = () => {
    setSpecFields([...specFields, { name: "", type: "TEXT", required: false }])
  }

  const updateSpecField = (index: number, field: Partial<SpecField>) => {
    const updated = [...specFields]
    updated[index] = { ...updated[index], ...field }
    setSpecFields(updated)
  }

  const removeSpecField = (index: number) => {
    setSpecFields(specFields.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {category ? "Sửa danh mục" : "Thêm danh mục mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

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
              <Label htmlFor="name">Tên danh mục *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên danh mục"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả danh mục"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">Hình ảnh</Label>
              <div className="space-y-3">
                {/* Image Preview */}
                {(imagePreview || formData.image) && (
                  <div className="relative w-32 h-32 border border-border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview || formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* File Input */}
                <div>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Chọn hình ảnh từ máy tính hoặc nhập URL
                  </p>
                </div>
                
                {/* URL Input (fallback) */}
                <div>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Hoặc nhập URL hình ảnh"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spec Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Thông số kỹ thuật</h3>
              <Button
                type="button"
                onClick={addSpecField}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Thêm thông số
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Thêm các thông số kỹ thuật để so sánh sản phẩm trong danh mục này
            </p>

            {specFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có thông số kỹ thuật nào</p>
                <p className="text-sm">Nhấn "Thêm thông số" để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {specFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Tên thông số</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateSpecField(index, { name: e.target.value })}
                          placeholder="VD: Màn hình, RAM, CPU..."
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Kiểu dữ liệu</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateSpecField(index, { type: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SPEC_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={field.required}
                          onChange={(e) => updateSpecField(index, { required: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor={`required-${index}`} className="text-xs">
                          Bắt buộc
                        </Label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeSpecField(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              disabled={loading || !formData.name.trim()}
            >
              {loading ? "Đang lưu..." : category ? "Cập nhật" : "Tạo danh mục"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}