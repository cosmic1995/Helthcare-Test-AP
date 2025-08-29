'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToastProvider() {
  const { theme } = useTheme()

  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        className: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        descriptionClassName: 'group-[.toast]:text-muted-foreground',
        actionButtonClassName: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButtonClassName: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      }}
      closeButton
      richColors
      expand
      visibleToasts={5}
      duration={5000}
    />
  )
}
