"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import type { ApiSpec } from "@/lib/api"

interface ProductSpecsProps {
  specs: ApiSpec[]
}

const MAX_VISIBLE_ROWS = 10

export default function ProductSpecs({ specs }: ProductSpecsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const showButton = specs.length > MAX_VISIBLE_ROWS
  const visibleSpecs = isExpanded ? specs : specs.slice(0, MAX_VISIBLE_ROWS)

  return (
    <div className="flex-1 flex flex-col">
      <table className="w-full">
        <tbody>
          {visibleSpecs.map((spec, index) => (
            <tr key={spec.id} className={index % 2 === 0 ? "bg-secondary/30" : "bg-card"}>
              <td className="px-6 py-4 font-semibold text-foreground w-1/3">{spec.specField.name}</td>
              <td className="px-6 py-4 text-muted-foreground">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showButton && (
        <div className="mt-4 flex justify-center pb-4">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <span>Thu gọn</span>
                <ChevronDownIcon className="w-4 h-4 rotate-180 transition-transform" />
              </>
            ) : (
              <>
                <span>Xem thêm</span>
                <ChevronDownIcon className="w-4 h-4 transition-transform" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

