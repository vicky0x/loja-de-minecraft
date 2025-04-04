'use client';

import { useState, useEffect } from 'react';
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

  // Verificar estado de redirecionamento ao carregar
  useEffect(() => {
    try {
      // Verificar se há um parâmetro de reset na URL
      const searchParams = new URLSearchParams(window.location.search);
      const isReset = searchParams.get('reset') === '1';
      
      if (isReset) {
        console.log('Reset solicitado via URL. Limpando todos os dados de autenticação...');
        
        // Limpar completamente o localStorage
        localStorage.clear();
        
        // Remover todos os cookies
        if (document.cookie) {
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
          }
        }
        
        // Mostrar mensagem para o usuário
        setError('Sua sessão foi reiniciada devido a um problema. Por favor, faça login novamente.');
        
        // Remover o parâmetro reset da URL para evitar loops
        window.history.replaceState({}, document.title, '/auth/login');
        return;
      }
      
      // Verificar se há detecção de loop
      const loopDetected = localStorage.getItem('loop_detected') === 'true';
      if (loopDetected) {
        console.warn('Loop de redirecionamento detectado na página de login. Interrompendo ações.');
        
        // Remover flags problemáticas para permitir um novo login limpo
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.setItem('auth_redirect_triggered', 'false');
        
        // Mostrar mensagem ao usuário
        setError('Detectamos um problema com sua sessão. Por favor, faça login novamente.');
        return;
      }

      // Limpar o estado de redirecionamento múltiplo para evitar loops
      if (localStorage.getItem('auth_redirect_triggered') === 'multiple') {
        localStorage.setItem('auth_redirect_triggered', 'false');
      }
      
      // Registrar que estamos na página de login (para detecção de loops)
      const now = Date.now();
      let redirectHistory: Array<{from?: string, to?: string, page?: string, timestamp: number}> = [];
      
      try {
        const storedHistory = localStorage.getItem('redirect_history');
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed)) {
            // Limpar entradas mais antigas que 10 segundos
            redirectHistory = parsed.filter(entry => 
              entry && typeof entry === 'object' && 
              typeof entry.timestamp === 'number' && 
              (now - entry.timestamp) < 10000
            );
          }
        }
      } catch (e) {
        console.error('Erro ao analisar histórico de redirecionamento:', e);
        redirectHistory = [];
      }
      
      // Adicionar entrada atual
      redirectHistory.push({
        page: '/auth/login',
        timestamp: now
      });
      
      // Salvar histórico atualizado
      localStorage.setItem('redirect_history', JSON.stringify(redirectHistory));
      
      // Verificar se o usuário já está logado
      const token = localStorage.getItem('auth_token');
      const isAuthStored = localStorage.getItem('isAuthenticated');
      
      // Se já estiver autenticado, redirecionar para dashboard ou carrinho
      if (token && isAuthStored === 'true') {
        // Verificar se havia um checkout pendente
        const pendingCheckout = localStorage.getItem('pending_checkout');
        
        if (pendingCheckout === 'true') {
          // Limpar a flag e redirecionar para o carrinho
          localStorage.removeItem('pending_checkout');
          router.push('/cart');
        } else {
          // Redirecionar para o dashboard normalmente
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar estado:', error);
    }
  }, [router]);

  // Login com email e senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Email ou senha inválidos');
        setLoading(false);
        return;
      }
      
      // Verificar se temos um token nos cookies
      const cookies = document.cookie.split(';');
      let authToken = '';
      
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token') {
          authToken = value;
          break;
        }
      }
      
      // Se não encontrou nos cookies, usar resposta direta da API
      if (!authToken && response.headers.get('Set-Cookie')) {
        const setCookie = response.headers.get('Set-Cookie') || '';
        const match = setCookie.match(/auth_token=([^;]+)/);
        if (match && match[1]) {
          authToken = match[1];
        }
      }
      
      // Como backup final, verificar se o token foi retornado no corpo da resposta
      if (!authToken && data.token) {
        authToken = data.token;
      }
      
      if (authToken) {
        // Armazenar token no localStorage para uso nas requisições futuras
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('isAuthenticated', 'true');
        
        // Armazenar dados do usuário se disponíveis
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Login foi bem-sucedido
        setLoginSuccess(true);
        
        // Limpar qualquer flag de redirecionamento
        try {
          localStorage.setItem('auth_redirect_triggered', 'false');
          localStorage.removeItem('loop_detected');
          localStorage.removeItem('loop_detected_time');
          localStorage.removeItem('force_login_page');
          localStorage.removeItem('redirect_history');
          localStorage.removeItem('dashboard_redirect_attempts');
        } catch (e) {
          // Ignorar erros
        }
        
        // Verificar se havia um checkout pendente
        const pendingCheckout = localStorage.getItem('pending_checkout');
        
        if (pendingCheckout === 'true') {
          // Limpar a flag e redirecionar para o carrinho
          try {
            localStorage.removeItem('pending_checkout');
          } catch (e) {
            // Ignorar erros
          }
          
          // Redirecionar após breve delay
          setTimeout(() => {
            console.log('Redirecionando para o carrinho após login bem-sucedido');
            window.location.href = '/cart';
          }, 1000);
        } else {
          // Redirecionar para a página de dashboard normalmente
          setTimeout(() => {
            console.log('Redirecionando para o dashboard após login bem-sucedido');
            window.location.href = '/dashboard';
          }, 1000);
        }
      } else {
        setError('Erro ao processar autenticação. Token não encontrado.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro ao conectar ao servidor. Tente novamente.');
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