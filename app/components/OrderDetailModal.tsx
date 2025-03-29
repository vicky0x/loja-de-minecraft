'use client';

import React from 'react';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  orderId
}: OrderDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-200 p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Detalhes do Pedido</h2>
        <p>ID do pedido: {orderId}</p>
        <button 
          onClick={onClose}
          className="mt-4 bg-primary px-4 py-2 rounded hover:bg-primary/80"
        >
          Fechar
        </button>
      </div>
    </div>
  );
} 