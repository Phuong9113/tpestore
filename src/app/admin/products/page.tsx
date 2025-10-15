"use client"

import { useState } from "react"
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import ProductModal from "@/components/admin/ProductModal"
import products from "@/data/product.json"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const categories = ["all", ...new Set(products.products.map((p) => p.category))]

  const filteredProducts = products.products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = (productId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      console.log("Delete product:", productId)
    }
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách sản phẩm trong cửa hàng</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm sản phẩm
        </button>
      </div>

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
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "Tất cả danh mục" : cat}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Đánh giá
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
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
                      {product.category}
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
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-foreground">{product.rating}</span>
                    </div>
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

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={editingProduct} />
    </div>
  )
}
