export default function TopProducts() {
    const products = [
      { name: "iPhone 15 Pro Max", sales: 245, revenue: 73475000, trend: "+12%" },
      { name: "MacBook Pro M3", sales: 156, revenue: 82664000, trend: "+8%" },
      { name: "Samsung S24 Ultra", sales: 189, revenue: 60461000, trend: "+15%" },
      { name: "iPad Pro M2", sales: 134, revenue: 30806000, trend: "+5%" },
      { name: "AirPods Pro 2", sales: 312, revenue: 20248000, trend: "+22%" },
    ]
  
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Sản phẩm bán chạy</h3>
          <span className="text-sm text-muted-foreground">Top 5</span>
        </div>
  
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.sales} đã bán • {product.revenue.toLocaleString("vi-VN")}₫
                </p>
              </div>
              <span className="text-sm font-medium text-green-500">{product.trend}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  