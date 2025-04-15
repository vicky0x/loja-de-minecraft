'use client';

import React from 'react';
import Image from 'next/image';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderStatusBadge from './OrderStatusBadge';

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

  // Função para determinar a cor do status
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-500 text-green-100';
      case 'processing':
        return 'bg-blue-500 text-blue-100';
      case 'pending':
        return 'bg-yellow-500 text-yellow-100';
      case 'canceled':
        return 'bg-red-500 text-red-100';
      case 'expired':
        return 'bg-red-400 text-red-100';
      case 'fulfilled':
        return 'bg-purple-500 text-purple-100';
      default:
        return 'bg-gray-500 text-gray-100';
    }
  };
  
  // Função para traduzir o status
  const translateStatus = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Pago';
      case 'completed':
        return 'Completo';
      case 'processing':
        return 'Processando';
      case 'pending':
        return 'Pendente';
      case 'canceled':
        return 'Cancelado';
      case 'expired':
        return 'Expirado';
      case 'fulfilled':
        return 'Entregue';
      default:
        return status || 'Desconhecido';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-200 p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Detalhes do Pedido</h2>
        <p>ID do pedido: {orderId}</p>
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-gray-400">Status do pagamento:</span>
          <OrderStatusBadge 
            status={order?.paymentStatus || order?.paymentInfo?.status} 
            size="md"
          />
        </div>
        
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-gray-400">Status do pedido:</span>
          <OrderStatusBadge 
            status={order?.orderStatus} 
            size="md"
          />
        </div>
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