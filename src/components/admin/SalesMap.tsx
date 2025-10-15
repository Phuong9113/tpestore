export default function SalesMap() {
    const regions = [
      { name: "Hà Nội", sales: 45, color: "bg-blue-500" },
      { name: "TP. Hồ Chí Minh", sales: 38, color: "bg-green-500" },
      { name: "Đà Nẵng", sales: 12, color: "bg-yellow-500" },
      { name: "Cần Thơ", sales: 8, color: "bg-purple-500" },
      { name: "Hải Phòng", sales: 7, color: "bg-orange-500" },
      { name: "Khác", sales: 5, color: "bg-gray-500" },
    ]
  
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Doanh số theo khu vực</h3>
          <span className="text-sm text-muted-foreground">Việt Nam</span>
        </div>
  
        <div className="space-y-3">
          {regions.map((region) => (
            <div key={region.name} className="flex items-center gap-3">
              <div className={`w-3 h-3 ${region.color} rounded-full flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{region.name}</span>
                  <span className="text-sm font-medium text-foreground">{region.sales}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${region.color}`} style={{ width: `${region.sales}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
  
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Khu vực hàng đầu</p>
              <p className="text-sm font-medium text-foreground mt-1">Hà Nội</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tăng trưởng cao nhất</p>
              <p className="text-sm font-medium text-foreground mt-1">Đà Nẵng</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  