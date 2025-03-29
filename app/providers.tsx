'use client';

import React from 'react';
import { CartProvider } from '@/app/contexts/CartContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
} 