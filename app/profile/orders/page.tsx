'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderDetailModal from '@/app/components/OrderDetailModal';
import OrderStatusBadge from '@/app/components/OrderStatusBadge';

export default function ProfileOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de produtos adquiridos no dashboard
    router.push('/dashboard/products');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin text-primary text-4xl mb-4">
        <FiLoader />
      </div>
      <h2 className="text-xl font-medium mb-2">Redirecionando...</h2>
      <p className="text-gray-400">Você está sendo redirecionado para a página de produtos adquiridos.</p>
    </div>
  );
} 