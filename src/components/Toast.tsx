"use client"

import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { useEffect } from "react"

interface ToastProps {
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-accent text-accent-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-accent-foreground/10 rounded transition-colors">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
