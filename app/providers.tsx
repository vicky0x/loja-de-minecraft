'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          className: '',
          style: {
            background: '#1e1e23',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            fontSize: '14px',
            maxWidth: '320px',
            fontWeight: 500,
          },
          success: {
            icon: '✅',
            style: {
              background: 'rgba(22, 101, 52, 0.95)',
              borderLeft: '4px solid #22c55e',
            },
          },
          error: {
            icon: '❌',
            style: {
              background: 'rgba(127, 29, 29, 0.95)',
              borderLeft: '4px solid #ef4444',
            },
          },
        }}
      />
      {children}
    </>
  );
} 