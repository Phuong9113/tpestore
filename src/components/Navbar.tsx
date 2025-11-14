"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline"
import { MonitorIcon, HeadphonesIcon } from "lucide-react"

const categories = [
  { name: "Điện thoại", href: "/products?category=Điện thoại", icon: DevicePhoneMobileIcon },
  { name: "Laptop", href: "/products?category=Laptop", icon: ComputerDesktopIcon },
  { name: "Màn hình máy tính", href: "/products?category=Màn hình máy tính", icon: MonitorIcon },
  { name: "Thiết bị âm thanh", href: "/products?category=Thiết bị âm thanh", icon: HeadphonesIcon },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-t border-border">
      <ul className="flex items-center gap-1 py-2 overflow-x-auto">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive = pathname.includes(category.href.split("?")[0])

          return (
            <li key={category.name}>
              <Link
                href={category.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{category.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
