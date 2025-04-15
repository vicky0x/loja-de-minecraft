'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Verificar a validade do token
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          toast.error('Link de redefinição inválido ou expirado.');
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        setTokenValid(false);
        toast.error('Erro ao verificar link de redefinição.');
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Erro ao redefinir senha.');
        return;
      }
      
      // Reset bem-sucedido
      setResetSuccess(true);
      toast.success('Senha redefinida com sucesso!');
      
      // Redirecionar para a página de login após 3 segundos
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      toast.error('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Renderização condicional com base na validade do token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <div className="w-full max-w-md px-4 text-center">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold text-white mb-2">Verificando...</h1>
            <p className="text-gray-400">Verificando seu link de redefinição</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <div className="w-full max-w-md px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-gray-400 mb-6">
            O link de redefinição de senha é inválido ou expirou.
          </p>
          <Link 
            href="/auth/forgot-password" 
            className="py-3 px-6 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors duration-300 inline-block"
          >
            Solicitar Novo Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Redefinir Senha</h1>
          <p className="text-gray-400">
            {resetSuccess
              ? 'Senha redefinida com sucesso! Redirecionando para o login.'
              : 'Crie uma nova senha para sua conta'}
          </p>
        </div>
        
        {!resetSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors duration-300"
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        ) : (
          <div className="w-full py-4 bg-green-500/20 text-green-400 rounded-md text-center">
            Senha redefinida com sucesso! Redirecionando para o login...
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link 
            href="/auth/login" 
            className="text-primary hover:text-primary-light transition-colors duration-300"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
} 