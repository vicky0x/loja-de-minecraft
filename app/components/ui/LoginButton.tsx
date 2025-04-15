'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Tentando login como admin');
      
      // Credenciais de admin para teste
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'admin@example.com', 
          password: 'password123'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }
      
      console.log('Login bem-sucedido:', data);
      
      // Navegar para o painel de admin
      router.push('/admin');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleAdminLogin}
        disabled={loading}
        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded shadow-lg"
      >
        {loading ? 'Entrando...' : 'Login (Admin)'}
      </button>
    </div>
  );
} 