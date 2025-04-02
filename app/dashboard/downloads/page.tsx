'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';

// Definir a função fetchAssignments globalmente para prevenir erros
export const fetchAssignments = async (page: number = 1): Promise<void> => {
  try {
    console.warn('fetchAssignments foi chamado na página de downloads, mas está desativado para prevenir erros. Página:', page);
    return Promise.resolve();
  } catch (error) {
    console.error('Erro em fetchAssignments:', error);
    return Promise.resolve();
  }
};

// Atribuir à window para garantir que está disponível globalmente
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.fetchAssignments = fetchAssignments;
}

export default function DownloadsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de produtos sem tentar buscar assignments
    // Isso evita o erro createUnhandledError que estava ocorrendo
    try {
      router.replace('/dashboard/products');
    } catch (error) {
      console.error('Erro ao redirecionar:', error);
      // Em caso de erro, tentar novamente após um breve delay
      setTimeout(() => {
        window.location.href = '/dashboard/products';
      }, 1000);
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4">
        <FiLoader className="opacity-0" />
      </div>
      <p className="text-gray-400">Redirecionando para a página de produtos...</p>
    </div>
  );
} 