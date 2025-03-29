'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLogIn, FiLock, FiMail, FiAlertCircle } from 'react-icons/fi';

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
      
      console.log('Enviando requisição de login...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('Resposta do login:', response.status);
      
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
      console.log('Login bem-sucedido. Dados do usuário:', data.user);
      console.log('Cookies após login:', document.cookie);
      
      // Armazenar dados do usuário no localStorage como backup
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isAuthenticated', 'true');
      }
      
      // Marcar login como bem-sucedido
      setLoginSuccess(true);
      
      // Verificar papel do usuário para redirecionamento
      if (data.user && data.user.role === 'admin') {
        console.log('Usuário é admin, redirecionando para /admin após timeout');
        // Timeout para garantir que os cookies sejam definidos
        setTimeout(() => {
          console.log('Executando redirecionamento para /admin');
          router.push('/admin');
        }, 2000);
      } else {
        console.log('Usuário normal, redirecionando para /dashboard após timeout');
        setTimeout(() => {
          console.log('Executando redirecionamento para /dashboard');
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-100">
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white">Entrar</h1>
            <p className="mt-2 text-gray-400">
              Faça login para acessar sua conta
            </p>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {loginSuccess && (
            <div className="mb-6 bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
              <span>Login bem-sucedido! Redirecionando...</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-dark-300 bg-dark-200 text-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-dark-300 bg-dark-200 text-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                Esqueceu a senha?
              </Link>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading || loginSuccess}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${(loading || loginSuccess) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </>
                ) : loginSuccess ? (
                  <>
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <FiLogIn className="mr-2" />
                    Entrar
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="text-primary hover:text-primary-dark">
                Cadastre-se
              </Link>
            </p>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-300">
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/images/auth-bg-pattern.png)', backgroundSize: 'cover' }}></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center p-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold text-white mb-6">
                Bem-vindo ao FantasyCheats
              </h2>
              <p className="text-xl text-white opacity-80">
                Entre na sua conta para acessar conteúdos exclusivos, gerenciar suas compras e muito mais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 