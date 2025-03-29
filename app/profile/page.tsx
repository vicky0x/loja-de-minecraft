'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de perfil no dashboard
    router.push('/dashboard/profile');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin text-primary text-4xl mb-4">
        <FiLoader />
      </div>
      <h2 className="text-xl font-medium mb-2">Redirecionando...</h2>
      <p className="text-gray-400">Você está sendo redirecionado para o seu perfil.</p>
    </div>
  );
} 