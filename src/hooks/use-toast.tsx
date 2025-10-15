'use client'

import * as React from 'react'
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'

// Sử dụng React.FC cho component, không dùng RadixToastProvider như type
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RadixToastProvider swipeDirection="right">
      {children}
      <ToastViewport />
    </RadixToastProvider>
  )
}

type ToastItem = {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, ...options }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const ToastContainer: React.FC = () => (
    <>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant}>
          <ToastTitle>{t.title}</ToastTitle>
          {t.description && <ToastDescription>{t.description}</ToastDescription>}
          <ToastClose />
        </Toast>
      ))}
    </>
  )

  return { toast, ToastContainer }
}
