'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Email ou senha incorretos.');
        } else if (response.status === 429) {
          setError('Muitas tentativas de login. Tente novamente mais tarde.');
        } else {
          setError(data.message || 'Erro ao fazer login. Tente novamente.');
        }
        return;
      }
      
      // Login bem-sucedido
      // Disparar evento para atualizar o estado de autenticação global
      const event = new CustomEvent('auth-state-changed');
      window.dispatchEvent(event);
      
      // Salvar dados do usuário no localStorage
      try {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isAuthenticated', 'true');
      } catch (storageError) {
        console.error('Erro ao salvar no localStorage:', storageError);
      }
      
      // Marcar login como bem-sucedido
      setLoginSuccess(true);
      
      // Verificar papel do usuário para redirecionamento
      if (data.user && data.user.role === 'admin') {
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      } else {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Entrar</h1>
          <p className="text-gray-400">Faça login para acessar sua conta</p>
        </div>
        
        {error && (
          <div className="text-red-400 mb-4 text-center">
            {error}
          </div>
        )}
        
        {loginSuccess && (
          <div className="text-green-400 mb-4 text-center">
            Login realizado com sucesso! Redirecionando...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-light">
              Esqueceu a senha?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={loading || loginSuccess}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors"
          >
            {loading ? 'Entrando...' : loginSuccess ? 'Redirecionando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Não tem uma conta?{' '}
            <Link href="/auth/register" className="text-primary hover:text-primary-light">
              Cadastre-se
            </Link>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-300">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
} 