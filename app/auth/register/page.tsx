'use client';

import { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para validação de username
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'blocked'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  
  // Referência para o timeout de debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar se o usuário já está autenticado - somente redireciona se já estiver logado
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar se o localStorage está disponível (evita erros no SSR)
        if (typeof window === 'undefined') return;
        
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const user = localStorage.getItem('user');
        
        // Só redireciona se o usuário já estiver autenticado
        if (isAuthenticated && user) {
          console.log('Usuário já está autenticado, redirecionando para o dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        // Apenas logar o erro sem afetar a renderização
        console.error('Erro ao verificar autenticação:', error);
      }
    };
    
    // Executar a verificação após um pequeno delay para garantir que o 
    // componente seja renderizado antes de qualquer redirecionamento
    const timer = setTimeout(checkAuth, 500);
    
    // Limpar o timer quando o componente for desmontado
    return () => clearTimeout(timer);
  }, [router]);
  
  // Função para verificar se um username está disponível
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }
    
    // Lista de palavras bloqueadas
    const blockedWords = [
      // Políticos e figuras controversas
      'lula', 'bolsonaro', 'trump', 'biden', 'hitler', 'mussolini', 'stalin', 'lenin',
      // Palavrões e ofensas (português e inglês)
      'puta', 'caralho', 'foda', 'buceta', 'viado', 'corno', 'porra', 'merda', 
      'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy', 'whore',
      // Termos relacionados a golpes
      'admin', 'moderador', 'staff', 'suporte', 'support', 'scam', 'hacker', 
      'golpe', 'fake', 'roubo', 'virus', 'hack', 'free', 'gratis'
    ];
    
    // Verificar se o username contém alguma palavra bloqueada
    const containsBlockedWord = blockedWords.some(word => 
      username.toLowerCase().includes(word.toLowerCase())
    );
    
    if (containsBlockedWord) {
      setUsernameStatus('blocked');
      setUsernameMessage('Este nome de usuário não é permitido');
      return;
    }
    
    setUsernameStatus('checking');
    
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.available) {
          setUsernameStatus('valid');
          setUsernameMessage('Nome de usuário disponível');
        } else {
          setUsernameStatus('invalid');
          setUsernameMessage(data.message || 'Este nome de usuário já está em uso');
        }
      } else {
        setUsernameStatus('invalid');
        setUsernameMessage(data.message || 'Erro ao verificar nome de usuário');
      }
    } catch (error) {
      console.error('Erro ao verificar nome de usuário:', error);
      setUsernameStatus('invalid');
      setUsernameMessage('Erro ao verificar disponibilidade');
    }
  }, []);
  
  // Implementação simples de debounce sem lodash
  const debouncedCheckUsername = useCallback((username: string) => {
    // Limpar o timer anterior se existir
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Definir novo timer
    debounceTimerRef.current = setTimeout(() => {
      checkUsername(username);
    }, 500);
  }, [checkUsername]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Verificar username enquanto o usuário digita
    if (name === 'username') {
      if (!value) {
        setUsernameStatus('idle');
        setUsernameMessage('');
      } else {
        setUsernameStatus('checking');
        setUsernameMessage('Verificando disponibilidade...');
        debouncedCheckUsername(value);
      }
    }
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (usernameStatus !== 'valid') {
      setError('Nome de usuário inválido ou indisponível');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Conta criada com sucesso! Você será redirecionado para o login.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.message || 'Erro ao criar conta');
      }
    } catch (error) {
      setError('Ocorreu um erro ao processar seu registro');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Criar conta</h1>
          <p className="text-gray-400">Cadastre-se para começar</p>
        </div>
        
        {error && (
          <div className="text-red-400 mb-4 text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-green-400 mb-4 text-center">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Nome de usuário
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="seu_username"
                className={`w-full bg-dark-200 border ${
                  usernameStatus === 'valid' 
                    ? 'border-green-500' 
                    : usernameStatus === 'invalid' || usernameStatus === 'blocked'
                    ? 'border-red-500'
                    : 'border-dark-300'
                } rounded-md py-2 px-3 pr-10 text-white focus:outline-none focus:ring-1 focus:ring-primary`}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {usernameStatus === 'checking' && (
                  <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                )}
                {usernameStatus === 'valid' && (
                  <FaCheck className="text-green-500" />
                )}
                {usernameStatus === 'invalid' && (
                  <FaTimes className="text-red-500" />
                )}
                {usernameStatus === 'blocked' && (
                  <FaExclamationTriangle className="text-red-500" />
                )}
              </div>
            </div>
            {usernameMessage && (
              <p className={`mt-1 text-sm ${
                usernameStatus === 'valid' 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {usernameMessage}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="seu@email.com"
              className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'invalid' || usernameStatus === 'blocked'}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="text-primary hover:text-primary-light">
              Entrar
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