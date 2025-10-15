"use client"

export default function CategoryChart() {
  const categories = [
    { name: "Điện thoại", value: 45, color: "bg-blue-500" },
    { name: "Laptop", value: 30, color: "bg-green-500" },
    { name: "Tablet", value: 15, color: "bg-yellow-500" },
    { name: "Phụ kiện", value: 10, color: "bg-purple-500" },
  ]

  const total = categories.reduce((sum, cat) => sum + cat.value, 0)

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Doanh thu theo danh mục</h3>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">{category.name}</span>
              <span className="text-sm font-medium text-foreground">{category.value}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${category.color} rounded-full`} style={{ width: `${category.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tổng doanh thu</span>
          <span className="text-lg font-bold text-foreground">₫124,500,000</span>
        </div>
      </div>
    </div>
  )
}
