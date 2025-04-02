'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';

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
  const [previewUrl, setPreviewUrl] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setError('O arquivo deve ser uma imagem (JPG, PNG ou GIF)');
      return;
    }

    // Verificar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB');
      return;
    }

    setError('');
    setProfileImage(file);
    
    // Converter para base64 para visualização prévia
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Usar FormData para incluir a imagem, se existir
      const submitData = new FormData();
      submitData.append('email', formData.email);
      submitData.append('username', formData.username);
      submitData.append('password', formData.password);
      
      if (profileImage) {
        submitData.append('profileImage', profileImage);
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: submitData,
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
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="brian"
              className="w-full bg-dark-200 border border-dark-300 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
            />
          </div>
          
          <div className="relative w-32 h-32 cursor-pointer mx-auto mt-4 rounded-full overflow-hidden border-2 border-primary-dark/50 transition-all duration-300 hover:border-primary-dark" onClick={handleImageClick}>
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview da imagem"
                width={128}
                height={128}
                className="object-cover w-full h-full"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                onError={(e) => {
                  console.log('Erro ao carregar imagem de pré-visualização');
                  e.currentTarget.style.display = 'none';
                  // Mostrar o ícone padrão como fallback
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center">
                      <span><FaUser size={48} className="text-white/70" /></span>
                    </div>`;
                  }
                }}
                unoptimized={true}
                priority={true}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center">
                <span><FaUser size={48} className="text-white/70" /></span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              ref={fileInputRef}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors"
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