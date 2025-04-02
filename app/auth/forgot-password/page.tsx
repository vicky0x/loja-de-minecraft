'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const user = localStorage.getItem('user');
        
        if (isAuthenticated && user) {
          console.log('Usuário já está autenticado, redirecionando para o dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
    };
    
    checkAuth();
  }, [router]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, digite seu email.');
      return;
    }
    
    try {
      setLoading(true);
      setError(''); // Limpar erros anteriores
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Erro ao solicitar redefinição de senha.');
        return;
      }
      
      // Sucesso
      setSuccess(true);
      toast.success('Email de redefinição enviado! Verifique sua caixa de entrada.');
      
    } catch (err) {
      console.error('Erro ao solicitar redefinição de senha:', err);
      setError('Erro ao conectar ao servidor. Verifique as configurações SMTP no arquivo .env.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
          <p className="text-gray-400">
            {success 
              ? 'Email enviado com sucesso! Verifique sua caixa de entrada para redefinir sua senha.' 
              : 'Digite seu email para receber um link de redefinição de senha'}
          </p>
        </div>
        
        {!success ? (
          <>
            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6">
                <p>Não foi possível enviar o email de recuperação. Por favor, tente novamente mais tarde.</p>
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
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors duration-300"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-6">
            <div className="bg-green-500/10 text-green-400 p-4 rounded-lg mb-6">
              <p>Email de recuperação enviado com sucesso!</p>
              <p className="text-sm mt-2">Verifique sua caixa de entrada (e a pasta de spam).</p>
            </div>
            <button 
              onClick={() => setSuccess(false)}
              className="w-full py-3 bg-dark-300 hover:bg-dark-400 text-white rounded-md font-medium transition-colors duration-300"
            >
              Enviar Novamente
            </button>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Lembrou sua senha?{' '}
            <Link 
              href="/auth/login" 
              className="text-primary hover:text-primary-light transition-colors duration-300"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
} 