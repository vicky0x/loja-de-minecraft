'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  FiUser, FiMail, FiLock, FiSave, FiAlertCircle, FiEdit, 
  FiPhone, FiMapPin, FiShield, FiDatabase, FiCreditCard, 
  FiUsers, FiActivity, FiPieChart
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

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
}

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { updateAuthTokens, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          console.log("Dados do usuário admin recebidos:", data.user);
          
          // Verificar se o usuário é administrador
          if (data.user && data.user.role !== 'admin') {
            router.push('/dashboard/profile');
            return;
          }
          
          setUser(data.user);
          setFormData({
            name: data.user?.name || '',
            email: data.user?.email || '',
            cpf: data.user?.cpf || '',
            phone: data.user?.phone || '',
            address: data.user?.address || '',
          });
        } else {
          setError('Erro ao carregar perfil');
          router.push('/auth/login');
        }
      } catch (error) {
        setError('Erro ao carregar perfil');
        console.error(error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
    fetchAdminStats();
  }, [router]);

  const fetchAdminStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (response.ok) {
        const data = await response.json();
        setAdminStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setStatsLoading(false);
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
      setFormData(prev => ({
        ...prev,
        [name]: formatCPF(value)
      }));
    } else if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhone(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
      setError('');
      
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
        
        // Garantir que a URL da imagem seja absoluta
        const imageUrl = data.imageUrl.startsWith('http') 
          ? data.imageUrl 
          : window.location.origin + data.imageUrl;
          
        console.log('Nova imagem de perfil (URL absoluta):', imageUrl);
        
        if (user) {
          // Atualizar estado local
          setUser({
            ...user,
            profileImage: imageUrl
          });
          
          // Ordem importante:
          // 1. Atualizar localStorage
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userData.profileImage = imageUrl;
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (storageError) {
            console.error('Erro ao atualizar imagem no localStorage:', storageError);
          }
          
          // 2. Disparar evento para notificar outros componentes
          setTimeout(() => {
            const event = new CustomEvent('profile-image-updated', {
              detail: {
                imageUrl: imageUrl,
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(event);
            console.log('Evento profile-image-updated disparado');
          }, 100);
          
          // Informar ao usuário
          setSuccess('Imagem de perfil atualizada com sucesso');
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
        console.log('Enviando requisição de atualização de perfil do admin...');
        const response = await fetch('/api/user/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        console.log('Resposta recebida com status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Perfil atualizado com sucesso');
          
          setSuccess('Perfil atualizado com sucesso');
          
          // Atualizar dados do usuário se o servidor retornou eles
          if (data.user) {
            setUser({
              ...user,
              ...data.user
            });
            
            // Atualizar dados do usuário no localStorage também
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                // Atualizar cada campo modificado
                Object.keys(data.user).forEach(key => {
                  userData[key] = data.user[key];
                });
                localStorage.setItem('user', JSON.stringify(userData));
              }
            } catch (storageError) {
              console.error('Erro ao atualizar dados no localStorage:', storageError);
            }
          }
        } else {
          const errorData = await response.json();
          console.error('Erro ao atualizar perfil:', errorData);
          setError(errorData.error || errorData.message || 'Erro ao atualizar perfil');
        }
      } else {
        setSuccess('Nenhuma alteração detectada');
      }
    } catch (error) {
      console.error('Erro durante a atualização do perfil:', error);
      setError('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
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
      <h2 className="text-2xl font-bold text-white">Perfil de Administrador</h2>
      
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
        {/* Coluna da esquerda */}
        <div className="space-y-6">
          {/* Card de perfil */}
          <div className="bg-dark-200 rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              <div 
                className="relative w-24 h-24 rounded-full overflow-hidden mb-4 bg-dark-300 cursor-pointer group"
                onClick={handleImageClick}
              >
                {(uploadedImage || user?.profileImage) ? (
                  <Image 
                    src={uploadedImage || user?.profileImage || '#'} 
                    alt={user?.username || 'Avatar'} 
                    fill
                    className="object-cover"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    onError={(e) => {
                      console.log('Erro ao carregar imagem de perfil:', uploadedImage || user?.profileImage);
                      // Usar um fallback diretamente em vez de um arquivo
                      e.currentTarget.style.display = 'none';
                      // Mostrar a primeira letra do nome do usuário como fallback
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary-dark/30">
                          <span class="text-white text-2xl font-bold">${user?.username.charAt(0).toUpperCase()}</span>
                        </div>`;
                      }
                    }}
                    unoptimized={true} // Desativar otimização para todas as imagens de perfil
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-bold bg-gradient-to-br from-primary/30 to-primary-dark/30">
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
                <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-md text-xs font-medium">
                  Administrador
                </span>
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
          
          {/* Estatísticas do painel */}
          <div className="bg-dark-200 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center">
              <FiActivity className="mr-2" />
              Estatísticas da Loja
            </h3>
            
            {statsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : adminStats ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-dark-300 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-900/30 text-blue-400 mr-3">
                      <FiUsers className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total de Usuários</p>
                      <p className="text-lg font-bold text-white">{adminStats?.users?.total || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-300 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-900/30 text-green-400 mr-3">
                      <FiDatabase className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Produtos</p>
                      <p className="text-lg font-bold text-white">{adminStats?.products?.total || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-300 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-900/30 text-yellow-400 mr-3">
                      <FiShield className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Pedidos</p>
                      <p className="text-lg font-bold text-white">{adminStats?.orders?.pending || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-300 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-900/30 text-purple-400 mr-3">
                      <FiPieChart className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Receita Total</p>
                      <p className="text-lg font-bold text-white">
                        R$ {adminStats?.orders?.revenue?.allTime?.revenue !== undefined ? 
                          adminStats.orders.revenue.allTime.revenue.toFixed(2).replace('.', ',') : 
                          '0,00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                Não foi possível carregar as estatísticas
              </div>
            )}
          </div>
        </div>
        
        {/* Formulário de edição de perfil */}
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
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></span>
                ) : (
                  <FiSave className="mr-2" />
                )}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Atividades recentes - para administradores */}
      {adminStats?.recentActivity && adminStats.recentActivity.length > 0 && (
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-6 text-white">Atividades Recentes</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-400">
              <thead className="bg-dark-300">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-300 divide-y divide-dark-400">
                {adminStats.recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-dark-400">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                        activity.type === 'order' 
                          ? 'bg-green-900/30 text-green-400' 
                          : activity.type === 'user' 
                            ? 'bg-blue-900/30 text-blue-400'
                            : activity.type === 'product'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-gray-900/30 text-gray-400'
                      }`}>
                        {activity.type === 'order' 
                          ? 'Pedido' 
                          : activity.type === 'user' 
                            ? 'Usuário'
                            : activity.type === 'product'
                              ? 'Produto'
                              : 'Sistema'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <span 
                        className="cursor-help" 
                        title={`ID completo: ${activity.id}`}
                      >
                        {activity.title || activity.description || `${activity.type} #${activity.id.toString().substr(-6)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(activity.date).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 