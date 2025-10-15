import type React from "react"
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid"

interface StatsCardProps {
  name: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ComponentType<{ className?: string }>
}

export default function StatsCard({ name, value, change, trend, icon: Icon }: StatsCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{name}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <ArrowUpIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {change}
            </span>
            <span className="text-sm text-muted-foreground">so với tháng trước</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  )
}
