'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'bg-gray-900 border-gray-800 text-cyber-white',
          title: 'text-cyber-white font-semibold',
          description: 'text-cyber-white/70',
          actionButton: 'bg-cyber-blue text-cyber-white',
          cancelButton: 'bg-gray-800 text-cyber-white',
          error: 'bg-red-900 border-red-800',
          success: 'bg-green-900 border-green-800',
          warning: 'bg-yellow-900 border-yellow-800',
          info: 'bg-blue-900 border-blue-800',
        },
      }}
      richColors
      closeButton
    />
  );
}
