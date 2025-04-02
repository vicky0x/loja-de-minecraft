'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await login(email, password);
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      // Atualizar o estado e o localStorage
      try {
        localStorage.setItem('isAuthenticated', 'true');
        
        // Garantir que temos um objeto de usuário válido antes de salvar
        if (data.user && typeof data.user === 'object') {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        // Disparar evento
        window.dispatchEvent(new Event('auth-state-changed'));
      } catch (storageError) {
        console.error('Erro ao salvar no localStorage:', storageError);
      }
      
      // Marcar login como bem-sucedido
      setLoginSuccess(true);
      
      // Verificar se há um redirecionamento pendente no localStorage
      let redirectTo = '/dashboard'; // Valor padrão
      try {
        const savedRedirect = localStorage.getItem('redirectAfterLogin');
        if (savedRedirect) {
          console.log('[LOGIN] Redirecionamento após login encontrado:', savedRedirect);
          redirectTo = savedRedirect;
          // Limpar o redirecionamento
          localStorage.removeItem('redirectAfterLogin');
        } else {
          console.log('[LOGIN] Nenhum redirecionamento encontrado, usando padrão:', redirectTo);
        }
      } catch (error) {
        console.error('[LOGIN] Erro ao processar redirecionamento:', error);
      } finally {
        // Redirecionar para a página apropriada após um breve delay
        setTimeout(() => router.push(redirectTo), 1000);
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