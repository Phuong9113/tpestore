"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import ProductModal from "@/components/admin/ProductModal"
import { 
  fetchAdminProducts, 
  deleteProduct, 
  fetchCategories,
  getProductTemplateUrl,
  importProductsFromExcel,
  type AdminProduct 
} from "@/lib/api"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [importing, setImporting] = useState(false)
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)
  const [templateCategoryId, setTemplateCategoryId] = useState<string>("")
  const [downloading, setDownloading] = useState(false)

  const handleDownloadTemplate = async (categoryId: string) => {
    try {
      setDownloading(true)
      const url = getProductTemplateUrl(categoryId)
      // Tải trực tiếp bằng điều hướng để tránh các vấn đề blob/CORS
      const cat = categories.find((c: any) => c.id === categoryId)
      const filename = cat?.name ? `template-${cat.name}.xlsx` : 'template.xlsx'
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setIsTemplatePickerOpen(false)
    } catch {
      alert('Đã xảy ra lỗi khi tải mẫu')
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchQuery, selectedCategory])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsResult, categoriesResult] = await Promise.allSettled([
        fetchAdminProducts({
          search: searchQuery || undefined,
          categoryId: selectedCategory !== "all" ? selectedCategory : undefined
        }),
        fetchCategories()
      ])

      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value.products)
        setError("")
      } else {
        setError("Không thể tải dữ liệu sản phẩm")
      }
      if (categoriesResult.status === 'fulfilled') {
        setCategories(categoriesResult.value)
      }
    } catch (err) {
      setError("Không thể tải dữ liệu sản phẩm")
    } finally {
      setLoading(false)
    }
  }

  const allCategories = [
    { id: "all", name: "Tất cả danh mục" },
    ...categories.map(cat => ({ id: cat.id, name: cat.name }))
  ]

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await deleteProduct(productId)
        await loadData() // Reload data
      } catch (err) {
        alert("Không thể xóa sản phẩm")
      }
    }
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    loadData() // Reload data after modal closes
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách sản phẩm trong cửa hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplatePickerOpen((v) => !v)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors border bg-primary/10 text-primary hover:bg-primary/20 border-primary/30`}
          >
            Tải mẫu Excel theo danh mục
          </button>
          <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer text-sm">
            Nhập Excel
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                const inputEl = e.currentTarget
                const file = inputEl.files?.[0]
                if (!file) return
                if (selectedCategory === 'all') { alert('Hãy chọn danh mục trước khi nhập.'); e.currentTarget.value = ''; return }
                try {
                  setImporting(true)
                  const result = await importProductsFromExcel(selectedCategory, file)
                  alert(`Đã nhập ${result.imported} sản phẩm`)
                  await loadData()
                } catch (err) {
                  alert('Không thể nhập file Excel')
                } finally {
                  setImporting(false)
                  if (inputEl) inputEl.value = ''
                }
              }}
            />
          </label>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        </div>
      </div>
      {isTemplatePickerOpen && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-3">
          <span className="text-sm text-muted-foreground">Chọn danh mục:</span>
          <select
            value={templateCategoryId}
            onChange={(e) => setTemplateCategoryId(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!templateCategoryId || downloading}
            onClick={() => {
              if (!templateCategoryId) { alert('Hãy chọn danh mục để tải mẫu.'); return }
              handleDownloadTemplate(templateCategoryId)
            }}
            className={`px-4 py-2 rounded-lg text-sm ${!templateCategoryId || downloading ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {downloading ? 'Đang tải...' : 'Tải'}
          </button>
          <button
            type="button"
            onClick={() => { setIsTemplatePickerOpen(false); setTemplateCategoryId("") }}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 text-sm"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {product.category?.name || "Khác"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{product.price.toLocaleString("vi-VN")}₫</p>
                      {product.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {product.originalPrice.toLocaleString("vi-VN")}₫
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.inStock ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {product.inStock ? "Còn hàng" : "Hết hàng"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal isOpen={isModalOpen} onClose={handleModalClose} product={editingProduct} categories={categories} />
    </div>
  )
}


