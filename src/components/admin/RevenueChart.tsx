"use client"

export default function RevenueChart() {
  const data = [
    { month: "T1", revenue: 45 },
    { month: "T2", revenue: 52 },
    { month: "T3", revenue: 48 },
    { month: "T4", revenue: 61 },
    { month: "T5", revenue: 55 },
    { month: "T6", revenue: 67 },
    { month: "T7", revenue: 72 },
    { month: "T8", revenue: 68 },
    { month: "T9", revenue: 75 },
    { month: "T10", revenue: 82 },
    { month: "T11", revenue: 78 },
    { month: "T12", revenue: 85 },
  ]

  const maxRevenue = Math.max(...data.map((d) => d.revenue))

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Doanh thu</h3>
          <p className="text-sm text-muted-foreground mt-1">Doanh thu theo tháng trong năm</p>
        </div>
        <select className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm">
          <option>2024</option>
          <option>2023</option>
        </select>
      </div>

      <div className="flex items-end justify-between gap-2 h-64">
        {data.map((item) => (
          <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-background rounded-t-lg relative" style={{ height: "100%" }}>
              <div
                className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
