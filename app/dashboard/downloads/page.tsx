'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';

export default function DownloadsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de produtos
    router.replace('/dashboard/products');
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