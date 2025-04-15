'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Verificar estado de autenticação e redirecionamento
  useEffect(() => {
    try {
      // Verificar e limpar qualquer parâmetro de emergência na URL
      const urlParams = new URLSearchParams(window.location.search);
      const emergency = urlParams.get('emergency');
      const logout = urlParams.get('logout');
      const logoutSuccess = urlParams.get('logout_success');
      const isReset = urlParams.get('reset') === '1';
      
      // Se houve um logout de emergência, exibir mensagem
      if (emergency) {
        setError('Detectamos um problema com sua sessão. Por favor, faça login novamente.');
        return;
      }
      
      // Se houve um logout normal com parâmetro antigo, exibir mensagem
      if (logout === 'success' || logoutSuccess === 'true') {
        // Exibir mensagem de logout bem-sucedido
        setError(null); // Limpar qualquer erro
        setLogoutSuccess(true);
        
        // Registrar que um logout foi realizado com sucesso
        sessionStorage.setItem('logout_completed', 'true');
        
        // Adicionar parâmetro para bloquear qualquer redirecionamento automático
        sessionStorage.setItem('block_auto_redirect', 'true');
        
        // Remover parâmetros da URL para manter limpa
        window.history.replaceState({}, document.title, '/auth/login');
        return;
      }
      
      // Se foi solicitado um reset completo
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
      
      // Sistema inteligente de detecção de navegação vs. loops
      try {
        // Obter histórico de navegação recente do sessionStorage (mais seguro que localStorage)
        const navigationHistory = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
        const now = Date.now();
        
        // Adicionar esta página ao histórico
        const currentPath = window.location.pathname;
        const currentUrl = window.location.href;
        navigationHistory.push({
          path: currentPath,
          timestamp: now,
          url: currentUrl
        });
        
        // Manter apenas as últimas 6 navegações
        if (navigationHistory.length > 6) {
          navigationHistory.shift();
        }
        
        // Salvar histórico atualizado
        sessionStorage.setItem('navigation_history', JSON.stringify(navigationHistory));
        
        // Verificar se temos um padrão de loop (mesmo URL exato visitado mais de 3 vezes em menos de 3 segundos)
        const recentVisits = navigationHistory.filter(entry => {
          return entry.path === currentPath && (now - entry.timestamp < 3000);
        });
        
        // Se encontrarmos mais de 3 visitas ao mesmo URL exato em menos de 3 segundos, isso é um loop
        if (recentVisits.length >= 3) {
          console.warn('Possível loop de navegação detectado. Verificando padrão...');
          
          // Verificar se é um padrão alternado normal (login -> register -> login) que é navegação esperada
          const isNormalNavigation = navigationHistory.length >= 3 && 
            ((navigationHistory[navigationHistory.length-1].path === '/auth/login' && 
              navigationHistory[navigationHistory.length-2].path === '/auth/register') ||
             (navigationHistory[navigationHistory.length-1].path === '/auth/register' && 
              navigationHistory[navigationHistory.length-2].path === '/auth/login'));
          
          if (!isNormalNavigation) {
            console.error('Loop de redirecionamento confirmado! Interrompendo ciclo.');
            sessionStorage.setItem('loop_detected', 'true');
            sessionStorage.setItem('loop_detected_time', now.toString());
            setError('Detectamos um problema com sua sessão. Aguarde alguns segundos e tente fazer login novamente.');
            
            // Limpar quaisquer dados inconsistentes de autenticação
            localStorage.removeItem('auth_token');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
            return;
          } else {
            console.log('Navegação normal entre login e cadastro detectada, não é um loop.');
          }
        }
      } catch (historyError) {
        console.error('Erro ao processar histórico de navegação:', historyError);
      }
      
      // Verificar se o usuário já está logado
      const token = localStorage.getItem('auth_token');
      const isAuthStored = localStorage.getItem('isAuthenticated');
      
      // Se já estiver autenticado, redirecionar para dashboard ou carrinho
      if (token && isAuthStored === 'true' && !logoutSuccess) {
        // Verificar se havia um checkout pendente
        const pendingCheckout = localStorage.getItem('pending_checkout');
        
        // Verificar se há um bloqueio de redirecionamento ativo
        if (sessionStorage.getItem('block_auto_redirect') === 'true') {
          console.warn('Redirecionamento automático bloqueado temporariamente');
          setError('Sua sessão parece estar ativa. Clique em "Entrar" para continuar ou aguarde alguns segundos.');
          
          // Remover o bloqueio após 5 segundos
          setTimeout(() => {
            sessionStorage.removeItem('block_auto_redirect');
          }, 5000);
          return;
        }
        
        if (pendingCheckout === 'true') {
          // Limpar a flag e redirecionar para o carrinho
          localStorage.removeItem('pending_checkout');
          router.push('/cart');
        } else {
          // Redirecionar para o dashboard normalmente
          console.log('Redirecionando para o dashboard após login bem-sucedido');
          
          // Registrar o login recente no sessionStorage
          sessionStorage.setItem('fresh_login_detected', 'true');
          
          // Remover essa flag após 30 segundos (tempo suficiente para carregar a dashboard)
          setTimeout(() => {
            sessionStorage.removeItem('fresh_login_detected');
          }, 30000);
          
          setTimeout(() => {
            // Adicionar parâmetro para forçar uma carga limpa da dashboard
            const timestamp = Date.now();
            window.location.href = `/dashboard?fresh_login=true&t=${timestamp}`;
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar estado:', error);
    }
  }, [router]);

  // Inicializar estados baseados no sessionStorage
  useEffect(() => {
    // Verificar se houve um logout recente
    if (sessionStorage.getItem('logout_completed') === 'true') {
      setLogoutSuccess(true);
      // Limpar após 1 minuto
      setTimeout(() => {
        sessionStorage.removeItem('logout_completed');
        setLogoutSuccess(false);
      }, 60000);
    }
  }, []);

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
      console.log(`Tentando login com email: ${email}`);
      
      // Usar a função do hook useAuth para login
      const result = await login(email, password);
      
      console.log('Resultado do login:', result);
      
      if (!result.success) {
        setError(result.message || 'Email ou senha inválidos');
        setLoading(false);
        return;
      }
      
      // Login foi bem-sucedido
      setLoginSuccess(true);
      
      // Limpar qualquer flag de redirecionamento e valores que podem causar problemas
      try {
        // LocalStorage
        localStorage.setItem('auth_redirect_triggered', 'false');
        localStorage.removeItem('loop_detected');
        localStorage.removeItem('loop_detected_time');
        localStorage.removeItem('force_login_page');
        localStorage.removeItem('redirect_history');
        localStorage.removeItem('dashboard_redirect_attempts');
        
        // SessionStorage - limpar para evitar problemas na dashboard
        sessionStorage.removeItem('anti_loop_active');
        sessionStorage.removeItem('auth_check_in_progress');
        sessionStorage.removeItem('block_auto_redirect');
        sessionStorage.removeItem('block_auth_checks');
        sessionStorage.removeItem('dashboard_loading_start');
        sessionStorage.removeItem('logout_completed');
        sessionStorage.removeItem('logout_in_progress');
      } catch (e) {
        // Ignorar erros
        console.error('Erro ao limpar flags de redirecionamento:', e);
      }
      
      // Verificar se havia um checkout pendente
      const pendingCheckout = localStorage.getItem('pending_checkout');
      
      if (pendingCheckout === 'true') {
        // Limpar a flag e redirecionar para o carrinho
        console.log('Redirecionando para o carrinho após login (checkout pendente)');
        try {
          localStorage.removeItem('pending_checkout');
        } catch (e) {
          // Ignorar erros
          console.error('Erro ao remover flag de checkout pendente:', e);
        }
        
        // Redirecionar após breve delay
        setTimeout(() => {
          console.log('Redirecionando para o carrinho após login bem-sucedido');
          window.location.href = '/cart';
        }, 1000);
      } else {
        // Redirecionar para a página de dashboard normalmente
        console.log('Redirecionando para o dashboard após login bem-sucedido');
        
        // Registrar o login recente no sessionStorage
        sessionStorage.setItem('fresh_login_detected', 'true');
        
        // Remover essa flag após 30 segundos (tempo suficiente para carregar a dashboard)
        setTimeout(() => {
          sessionStorage.removeItem('fresh_login_detected');
        }, 30000);
        
        setTimeout(() => {
          // Adicionar parâmetro para forçar uma carga limpa da dashboard
          const timestamp = Date.now();
          window.location.href = `/dashboard?fresh_login=true&t=${timestamp}`;
        }, 1000);
      }
    } catch (err) {
      console.error('Erro durante o processo de login:', err);
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
        
        {logoutSuccess && (
          <div className="text-green-400 mb-4 text-center">
            Logout realizado com sucesso!
          </div>
        )}
        
        {loginSuccess && !logoutSuccess && (
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
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
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
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
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
            disabled={loading || (loginSuccess && !logoutSuccess)}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors"
          >
            {loading ? 'Entrando...' : 
             (loginSuccess && !logoutSuccess) ? 'Redirecionando...' : 'Entrar'}
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
        
        {/* Script do Charla Widget */}
        <script 
          type="text/javascript" 
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', () => { 
                const widgetElement = document.createElement('charla-widget'); 
                widgetElement.setAttribute("p", "fa696af4-1622-4275-8c59-6fa5175705cd"); 
                document.body.appendChild(widgetElement);
                const widgetCode = document.createElement('script'); 
                widgetCode.src = 'https://app.getcharla.com/widget/widget.js'; 
                document.body.appendChild(widgetCode); 
              })
            `
          }}
        />
      </div>
    </div>
  );
} 