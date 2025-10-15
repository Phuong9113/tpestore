"use client"

import { MagnifyingGlassIcon, BellIcon, UserCircleIcon } from "@heroicons/react/24/outline"

export default function AdminHeader() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <UserCircleIcon className="w-8 h-8" />
          <span className="text-sm font-medium">Admin</span>
        </button>
      </div>
    </header>
  )
}
