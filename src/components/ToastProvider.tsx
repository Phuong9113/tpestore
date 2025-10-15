"use client"

import { Toaster, toast } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      richColors
      closeButton
      position="bottom-right"
      duration={5000} // tự tắt sau 5s
      gutter={12}
    />
  )
}

export { toast }
