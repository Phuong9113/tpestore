"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline"
import { HeadphonesIcon } from "lucide-react"

const categories = [
  { name: "Điện thoại", href: "/products?category=phone", icon: DevicePhoneMobileIcon },
  { name: "Laptop", href: "/products?category=laptop", icon: ComputerDesktopIcon },
  { name: "Tablet", href: "/products?category=tablet", icon: DeviceTabletIcon },
  { name: "Phụ kiện", href: "/products?category=accessories", icon: HeadphonesIcon },
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
