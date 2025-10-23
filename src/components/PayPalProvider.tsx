"use client"

import { PayPalScriptProvider } from "@paypal/react-paypal-js"

interface PayPalProviderProps {
  children: React.ReactNode
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  if (!paypalClientId) {
    console.warn('PayPal Client ID not configured')
    return <>{children}</>
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: "USD",
        intent: "capture",
      }}
    >
      {children}
    </PayPalScriptProvider>
  )
}
