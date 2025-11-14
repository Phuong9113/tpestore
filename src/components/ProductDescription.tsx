"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "@heroicons/react/24/outline"

interface ProductDescriptionProps {
  description: string
  maxHeight?: number
}

export default function ProductDescription({ 
  description, 
  maxHeight = 400 
}: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const scrollHeight = textRef.current.scrollHeight
      setShowButton(scrollHeight > maxHeight)
    }
  }, [description, maxHeight])

  return (
    <div className="h-full flex flex-col">
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 flex-1"
        style={{
          maxHeight: isExpanded ? "none" : `${maxHeight}px`,
        }}
      >
        <div className="prose prose-lg max-w-none">
          <p 
            ref={textRef}
            className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap"
          >
            {description}
          </p>
        </div>
      </div>
      {showButton && (
        <div className="mt-4 flex justify-center flex-shrink-0">
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

