'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(!!data.user);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
    }
    
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Chamada de API real para login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      // Redirecionar após login bem-sucedido
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout e limpar cookies
  const handleForceLogout = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Recarregar a página para aplicar as mudanças
        window.location.reload();
      } else {
        setError('Erro ao limpar autenticação');
      }
    } catch (error) {
      console.error('Erro ao limpar cookies:', error);
      setError('Erro ao limpar autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 px-4">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-primary font-bold text-3xl">Fantasy Cheats</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Bem-vindo de volta</h1>
          <p className="text-gray-400">Acesse sua conta para continuar</p>
        </div>

        {isAuthenticated && (
          <div className="bg-yellow-500/20 border border-yellow-500 text-white p-4 rounded mb-6">
            <p className="text-sm mb-2">Parece que você já está autenticado.</p>
            <button
              onClick={handleForceLogout}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded w-full"
              disabled={loading}
            >
              {loading ? 'Limpando...' : 'Limpar autenticação atual'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Senha
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-dark-300 text-primary focus:ring-primary"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
              Lembrar de mim
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-gray-400">Não tem uma conta?</span>{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
} 