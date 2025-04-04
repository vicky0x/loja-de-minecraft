'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}: LoadingSpinnerProps) {
  // Determinar tamanho do spinner
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  
  // Determinar cor do spinner
  const colorClass = `border-${color}`;
  
  return (
    <div className={`animate-spin rounded-full border-4 border-t-transparent ${sizeClass} ${colorClass} ${className}`} />
  );
} 