"use client"

import { Suspense, useEffect, useState } from "react"
import ProductCard from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { FunnelIcon } from "@heroicons/react/24/outline"
import { fetchProducts, fetchCategories, type UiProduct, type ApiCategory } from "@/lib/api"

function ProductsContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("featured")
  const [products, setProducts] = useState<UiProduct[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ])
        if (mounted) {
          setProducts(productsData)
          setCategories(categoriesData)
        }
      } catch (e) {
        if (mounted) setError("Không tải được danh sách sản phẩm")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const allCategories = [
    { id: "all", name: "Tất cả" },
    ...categories.map(cat => ({ id: cat.id, name: cat.name }))
  ]

  // Filter products
  let filteredProducts = products
  if (selectedCategory !== "all") {
    const selectedCat = categories.find(cat => cat.id === selectedCategory)
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCat?.name
    )
  }

  // Sort products
  if (sortBy === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price)
  } else if (sortBy === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price)
  } else if (sortBy === "name") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name))
  }


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Sản phẩm</h1>
        <p className="text-muted-foreground">Tìm thấy {filteredProducts.length} sản phẩm</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <FunnelIcon className="w-5 h-5 text-foreground" />
              <h2 className="font-semibold text-foreground">Bộ lọc</h2>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Danh mục</h3>
              <div className="space-y-2">
                {allCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Sắp xếp</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="featured">Nổi bật</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
                <option value="name">Tên: A-Z</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-16">Đang tải...</div>
          ) : error ? (
            <div className="text-center py-16 text-destructive">{error}</div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice || undefined}
                  image={product.image}
                  category={product.category}
                  rating={product.rating}
                  inStock={product.inStock}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Không tìm thấy sản phẩm nào</p>
              <Button onClick={() => setSelectedCategory("all")} variant="outline" className="mt-4">
                Xem tất cả sản phẩm
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Đang tải...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
