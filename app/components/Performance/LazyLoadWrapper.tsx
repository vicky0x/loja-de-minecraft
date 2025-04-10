'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyLoadWrapperProps {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  placeholder?: ReactNode;
  priority?: boolean;
  id?: string;
  className?: string;
}

/**
 * Componente para carregamento tardio de elementos pesados
 * Útil para melhorar o LCP (Largest Contentful Paint)
 * 
 * @param {ReactNode} children - Conteúdo a ser carregado tardiamente
 * @param {number} threshold - Porcentagem do elemento visível necessária para o carregamento (0-1)
 * @param {string} rootMargin - Margem ao redor do viewport
 * @param {ReactNode} placeholder - Elemento de placeholder enquanto carrega
 * @param {boolean} priority - Se deve ser carregado com prioridade
 * @param {string} id - ID do elemento
 * @param {string} className - Classes CSS
 */
export default function LazyLoadWrapper({
  children,
  threshold = 0.1,
  rootMargin = '200px 0px',
  placeholder,
  priority = false,
  id,
  className
}: LazyLoadWrapperProps) {
  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  // Carregar imediatamente para conteúdo prioritário
  useEffect(() => {
    if (priority || inView) {
      setLoaded(true);
    }
  }, [inView, priority]);

  // Para conteúdo com prioridade, renderizar imediatamente
  if (priority) {
    return <div id={id} className={className}>{children}</div>;
  }

  return (
    <div ref={ref} id={id} className={className}>
      {loaded ? children : placeholder || (
        <div className="animate-pulse bg-dark-300 rounded-md h-full w-full min-h-[100px]"></div>
      )}
    </div>
  );
} 