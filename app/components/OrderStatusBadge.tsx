'use client';

import React from 'react';
import { FiClock, FiCheck, FiX, FiAlertTriangle, FiRefreshCw, FiPackage } from 'react-icons/fi';

interface OrderStatusBadgeProps {
  status?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function OrderStatusBadge({ 
  status, 
  className = '',
  showIcon = true,
  size = 'md'
}: OrderStatusBadgeProps) {
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
  
  // Função para selecionar o ícone apropriado
  const StatusIcon = () => {
    if (!showIcon) return null;
    
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <FiCheck className="mr-1" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />;
      case 'processing':
        return <FiRefreshCw className="mr-1" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />;
      case 'pending':
        return <FiClock className="mr-1" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />;
      case 'canceled':
        return <FiX className="mr-1" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />;
      case 'expired':
        return <FiAlertTriangle className="mr-1" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />;
      case 'fulfilled':
        return <FiPackage className="mr-1" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />;
      default:
        return <FiClock className="mr-1" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />;
    }
  };
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2.5',
    lg: 'text-base py-1.5 px-3'
  };

  return (
    <span 
      className={`inline-flex items-center justify-center rounded-full font-medium ${sizeClasses[size]} ${getStatusColor(status)} ${className}`}
    >
      <StatusIcon />
      {translateStatus(status)}
    </span>
  );
} 