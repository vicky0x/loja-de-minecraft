'use client';

import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiX } from 'react-icons/fi';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
  severity?: 'error' | 'warning' | 'info';
}

export default function ErrorDisplay({
  title,
  message,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = true,
  severity = 'error'
}: ErrorDisplayProps) {
  // Definir cores baseadas na severidade
  const bgColor = severity === 'error' 
    ? 'bg-red-900/30' 
    : severity === 'warning' 
      ? 'bg-yellow-900/30' 
      : 'bg-blue-900/30';
  
  const textColor = severity === 'error' 
    ? 'text-red-400' 
    : severity === 'warning' 
      ? 'text-yellow-400' 
      : 'text-blue-400';
  
  const btnColor = severity === 'error' 
    ? 'bg-red-800 hover:bg-red-700' 
    : severity === 'warning' 
      ? 'bg-yellow-800 hover:bg-yellow-700' 
      : 'bg-blue-800 hover:bg-blue-700';
  
  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg shadow-md relative`}>
      {showDismiss && onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 hover:bg-black/20 rounded-full p-1"
          aria-label="Fechar"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex items-center mb-2">
        <FiAlertTriangle className="w-5 h-5 mr-2" />
        <h3 className="font-semibold">{title || 'Erro'}</h3>
      </div>
      
      <p className="mb-3 text-sm">{message}</p>
      
      {showRetry && onRetry && (
        <button 
          onClick={onRetry} 
          className={`text-white ${btnColor} px-3 py-1.5 text-sm rounded flex items-center`}
        >
          <FiRefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Tentar novamente
        </button>
      )}
    </div>
  );
} 