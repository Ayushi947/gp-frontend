'use client';

import { Toaster } from 'sonner';

/**
 * Toast provider component
 * Configures sonner toaster with bottom-center positioning
 * and custom styling to match the design system
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        className: 'font-sans',
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
      expand={false}
      richColors
      closeButton
      offset={16}
      gap={8}
    />
  );
}
