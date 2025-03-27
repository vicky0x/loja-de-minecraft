'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiUser, FiMail, FiLock, FiSave, FiAlertCircle, FiUpload, FiPhone, FiMapPin, FiShoppingBag, FiDollarSign, FiPackage, FiCreditCard, FiEdit } from 'react-icons/fi';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  memberNumber: number | null;
  profileImage?: string;
  createdAt: string;
  cpf?: string;
  address?: string;
  phone?: string;
  orders?: {
    count: number;
    total: number;
    products: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          console.log("Dados do usuário recebidos:", data.user);
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            password: '',
            confirmPassword: '',
            cpf: data.user.cpf || '',
            address: data.user.address || '',
            phone: data.user.phone || '',
          });
        } else {
          setError('Erro ao carregar perfil');
        }
      } catch (error) {
        setError('Erro ao carregar perfil');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      
      if (response.ok) {
        const data = await response.json();
        if (user) {
          setUser({
            ...user,
            orders: data.stats
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const validateCPF = (cpf: string) => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Evita CPFs óbvios como 11111111111
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    
    // Implementação básica de validação de CPF
    // Para uma validação completa, adicione o algoritmo de verificação dos dígitos
    return true;
  };

  const validatePhone = (phone: string) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem entre 10 e 11 dígitos (com ou sem DDD)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const formatCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length <= 3) return cleanCPF;
    if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
    if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
  };

  const formatPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length <= 2) return cleanPhone;
    if (cleanPhone.length <= 6) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
    if (cleanPhone.length <= 10) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Aplica formatação específica para CPF e telefone
    if (name === 'cpf') {
      setFormData({ ...formData, [name]: formatCPF(value) });
    } else if (name === 'phone') {
      setFormData({ ...formData, [name]: formatPhone(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      setIsUploading(true);
      
      // Converter para base64 para visualização prévia
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Preparar para upload
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess('Imagem de perfil atualizada com sucesso');
        // Atualizar o usuário com a nova URL da imagem
        if (user) {
          setUser({
            ...user,
            profileImage: data.imageUrl
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao enviar imagem');
        // Reverter a imagem preview
        setUploadedImage(null);
      }
    } catch (error) {
      setError('Erro ao fazer upload da imagem');
      console.error(error);
      setUploadedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validar formulário
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    // Validação de CPF
    if (formData.cpf && !validateCPF(formData.cpf)) {
      setError('CPF inválido. Digite um CPF válido.');
      return;
    }
    
    // Validação de telefone
    if (formData.phone && !validatePhone(formData.phone)) {
      setError('Telefone inválido. Digite um telefone válido com DDD.');
      return;
    }
    
    setSaving(true);
    
    try {
      // Preparar dados para atualização (só enviar campos que foram alterados)
      const updateData: any = {};
      
      if (formData.name && formData.name !== user?.name) {
        updateData.name = formData.name;
      }
      
      if (formData.email && formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      if (formData.cpf && formData.cpf !== user?.cpf) {
        updateData.cpf = formData.cpf;
      }
      
      if (formData.address && formData.address !== user?.address) {
        updateData.address = formData.address;
      }
      
      if (formData.phone && formData.phone !== user?.phone) {
        updateData.phone = formData.phone;
      }
      
      // Só atualiza se houver alterações
      if (Object.keys(updateData).length > 0) {
        const response = await fetch('/api/user/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuccess('Perfil atualizado com sucesso');
          
          // Atualizar dados do usuário se o servidor retornou eles
          if (data.user) {
            setUser({
              ...user,
              ...data.user
            });
          }
          
          // Limpar campos de senha
          setFormData({
            ...formData,
            password: '',
            confirmPassword: '',
          });
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Erro ao atualizar perfil');
        }
      } else {
        setSuccess('Nenhuma alteração detectada');
      }
    } catch (error) {
      setError('Erro ao atualizar perfil');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Helper para renderizar o cargo do usuário
  const renderRole = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded-md text-xs font-medium">Administrador</span>;
      case 'user':
        return user?.orders?.count ? (
          <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded-md text-xs font-medium">Cliente</span>
        ) : (
          <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded-md text-xs font-medium">Membro</span>
        );
      default:
        return <span className="bg-gray-900/30 text-gray-400 px-2 py-1 rounded-md text-xs font-medium">Usuário</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
      
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 p-4 mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/30 border-l-4 border-green-500 text-green-400 p-4 mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de informações e estatísticas */}
        <div className="space-y-6">
          {/* Informações de perfil */}
          <div className="bg-dark-200 rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              <div 
                className="relative w-24 h-24 rounded-full overflow-hidden mb-4 bg-dark-300 cursor-pointer group"
                onClick={handleImageClick}
              >
                {(uploadedImage || user?.profileImage) ? (
                  <Image 
                    src={uploadedImage || user?.profileImage || '/images/default-avatar.png'} 
                    alt={user?.username || 'Avatar'} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-bold">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiEdit className="text-white w-6 h-6" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <h3 className="text-xl font-bold text-white">{user?.name || user?.username}</h3>
              <div className="mt-2">
                {user && renderRole(user.role)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Nome de Usuário</p>
                <p className="font-medium text-white">{user?.username}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="font-medium text-white">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Membro desde</p>
                <p className="font-medium text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Número de Membro</p>
                <p className="font-medium text-white">{user?.memberNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Estatísticas de compras */}
          <div className="bg-dark-200 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-6 text-white">Estatísticas de Compras</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-900/30 text-blue-400 mr-3">
                    <FiShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pedidos Realizados</p>
                    <p className="text-lg font-bold text-white">{user?.orders?.count || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-900/30 text-green-400 mr-3">
                    <FiPackage className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Produtos Adquiridos</p>
                    <p className="text-lg font-bold text-white">{user?.orders?.products || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-900/30 text-purple-400 mr-3">
                    <FiDollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Valor Total</p>
                    <p className="text-lg font-bold text-white">
                      {user?.orders?.total 
                        ? `R$ ${user.orders.total.toFixed(2).replace('.', ',')}` 
                        : 'R$ 0,00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Formulário de edição */}
        <div className="md:col-span-2 bg-dark-200 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <h3 className="text-xl font-bold mb-4 text-white">Editar Perfil</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 block w-full pr-3 py-2 bg-dark-300 border border-dark-400 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  E-mail
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={user?.email || ''}
                    readOnly
                    className="pl-10 block w-full pr-3 py-2 bg-dark-300/50 border border-dark-400 text-gray-400 rounded-md focus:outline-none cursor-not-allowed"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-1">
                  CPF
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    className="pl-10 block w-full pr-3 py-2 bg-dark-300 border border-dark-400 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 block w-full pr-3 py-2 bg-dark-300 border border-dark-400 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                  Endereço Completo
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 block w-full pr-3 py-2 bg-dark-300 border border-dark-400 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2 border-t border-dark-400 pt-4">
                <h4 className="font-medium text-white mb-4">Alterar Senha</h4>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Nova Senha (deixe em branco para manter a atual)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 block w-full pr-3 py-2 bg-dark-300 border border-dark-400 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 block w-full pr-3 py-2 bg-dark-300 border border-dark-400 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
                ) : (
                  <FiSave className="mr-2" />
                )}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 