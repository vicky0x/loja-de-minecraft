'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiUser, FiMail, FiLock, FiSave, FiAlertCircle, FiUpload, FiPhone, FiMapPin, FiShoppingBag, FiDollarSign, FiPackage, FiCreditCard, FiEdit } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import { ProfileImageUpload } from '@/app/components/ProfileImageUpload';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'developer';
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
    cpf: '',
    phone: '',
    address: '',
  });

  const { updateProfileImage, forceRefreshUserData, updateAuthTokens, logout } = useAuth();

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          console.log("Dados do usuário recebidos:", data.user);
          
          // Se houver imagem de perfil, verificar se o caminho está completo
          let profileImageUrl = data.user?.profileImage || '';
          if (profileImageUrl && !profileImageUrl.startsWith('http')) {
            // Aplicar a URL completa incluindo o origin
            profileImageUrl = `${window.location.origin}${profileImageUrl}`;
            console.log("URL da imagem corrigida:", profileImageUrl);
            
            // Atualizar também no localStorage e no contexto de autenticação
            try {
              // 1. Atualizar no localStorage
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                userData.profileImage = profileImageUrl;
                localStorage.setItem('user', JSON.stringify(userData));
              }
              
              // 2. Usar a função do contexto para atualização global
              updateProfileImage(profileImageUrl);
            } catch (error) {
              console.error("Erro ao atualizar URL da imagem:", error);
            }
            
            // Atualizar data.user para uso abaixo
            data.user.profileImage = profileImageUrl;
          }
          
          // Garantir que o createdAt seja uma string válida para formatação
          if (data.user && data.user.createdAt) {
            console.log("Data de criação original:", data.user.createdAt);
            
            // Se for um objeto Date em formato string, garantir que seja uma string
            if (typeof data.user.createdAt === 'object') {
              data.user.createdAt = data.user.createdAt.toString();
            }
          } else if (data.user) {
            // Se não tiver data, tentar buscar do localStorage
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                if (userData.createdAt) {
                  data.user.createdAt = userData.createdAt;
                  console.log("Data de criação recuperada do localStorage:", data.user.createdAt);
                }
              }
            } catch (error) {
              console.error("Erro ao recuperar data do localStorage:", error);
            }
          }
          
          // Verificar explicitamente o número de membro
          if (data.user && data.user.memberNumber === null || data.user.memberNumber === undefined) {
            console.log("Número de membro não encontrado, tentando recuperar do localStorage");
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                if (userData.memberNumber) {
                  data.user.memberNumber = userData.memberNumber;
                  console.log("Número de membro recuperado do localStorage:", data.user.memberNumber);
                }
              }
            } catch (error) {
              console.error("Erro ao recuperar número de membro do localStorage:", error);
            }
          }
          
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            cpf: data.user.cpf || '',
            phone: data.user.phone || '',
            address: data.user.address || '',
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
  }, [updateProfileImage]);
  
  // Novo useEffect para carregar estatísticas após o usuário ser carregado
  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user?.id]); // Dependência do ID do usuário para evitar loops infinitos

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Estatísticas recebidas:', data.stats);
        
        setUser(prevUser => {
          if (prevUser) {
            return {
              ...prevUser,
              orders: data.stats
            };
          }
          return prevUser;
        });
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
      
      console.log('Enviando imagem para API...');
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          // Não definir Content-Type aqui para que o navegador defina o boundary correto para FormData
        }
      });
      
      console.log('Resposta da API de upload recebida, status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        
        // Usar a URL absoluta retornada diretamente pela API
        const imageUrl = data.imageUrl;
        console.log('Nova imagem de perfil (URL absoluta):', imageUrl);
        console.log('Dados completos retornados pela API:', data);
        
        if (user) {
          // Extrair e garantir que os dados de estatísticas sejam atualizados corretamente
          const userData = data.userData || {};
          const updatedStats = userData.stats || user.orders;
          
          console.log('Estatísticas atualizadas:', updatedStats);
          
          // Atualizar estado local com TODOS os dados retornados
          setUser({
            ...user,
            profileImage: imageUrl,
            orders: updatedStats,
            role: userData.role || user.role
          });
          
          // Também atualizar o uploadedImage
          setUploadedImage(imageUrl);
          
          // Ordem importante:
          // 1. Atualizar localStorage com os dados completos
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userLocalData = JSON.parse(storedUser);
              // Atualizar a imagem
              userLocalData.profileImage = imageUrl;
              
              // Atualizar estatísticas e cargo no localStorage de forma explícita
              if (userData.stats) {
                console.log('Atualizando estatísticas no localStorage:', userData.stats);
                userLocalData.orders = userData.stats;
              }
              
              if (userData.role) {
                userLocalData.role = userData.role;
              }
              
              localStorage.setItem('user', JSON.stringify(userLocalData));
              console.log('localStorage atualizado com sucesso:', userLocalData);
            }
          } catch (storageError) {
            console.error('Erro ao atualizar imagem no localStorage:', storageError);
          }
          
          // 2. Usar a função do contexto para atualização global
          updateProfileImage(imageUrl);
          console.log('Contexto atualizado via updateProfileImage()');
          
          // 3. Disparar evento para notificar outros componentes
          setTimeout(() => {
            const event = new CustomEvent('profile-image-updated', {
              detail: {
                imageUrl: imageUrl,
                timestamp: Date.now(),
                userStats: updatedStats
              }
            });
            window.dispatchEvent(event);
            console.log('Evento profile-image-updated disparado com estatísticas');
            
            // 4. Força uma atualização imediata dos dados, incluindo estatísticas
            fetchUserStats(); // Chamar explicitamente para garantir dados atualizados
            
            // 5. Forçar atualização global com pequeno delay
            setTimeout(() => {
              console.log('Forçando refresh dos dados do usuário...');
              forceRefreshUserData();
            }, 300);
          }, 100);
          
          // Informar ao usuário
          setSuccess('Imagem de perfil atualizada com sucesso');
        }
      } else {
        try {
          const errorData = await response.json();
          console.error('Erro na resposta da API:', errorData);
          setError(errorData.error || errorData.message || 'Erro ao enviar imagem');
        } catch (parseError) {
          console.error('Erro ao interpretar resposta:', parseError);
          setError(`Erro ao enviar imagem (status ${response.status})`);
        }
        // Reverter a imagem preview
        setUploadedImage(null);
      }
    } catch (error) {
      console.error('Erro durante o upload da imagem:', error);
      setError('Erro ao fazer upload da imagem');
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
        console.log('Enviando requisição de atualização de perfil...');
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

  // Helper para renderizar o cargo do usuário
  const renderRole = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded-md text-xs font-medium">Administrador</span>;
      case 'developer':
        return <span className="bg-green-900/30 text-green-500 px-2 py-1 rounded-md text-xs font-medium">Desenvolvedor</span>;
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

  // Novo useEffect para reagir às mudanças nas estatísticas e garantir atualização imediata
  useEffect(() => {
    const handleProfileImageUpdated = (e: CustomEvent) => {
      console.log('Evento de atualização de imagem recebido com dados:', e.detail);
      
      // Se o evento contiver estatísticas, atualizar imediatamente
      if (e.detail.userStats && user) {
        console.log('Atualizando estatísticas do componente via evento:', e.detail.userStats);
        
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          
          return {
            ...prevUser,
            orders: e.detail.userStats,
            profileImage: e.detail.imageUrl || prevUser.profileImage
          };
        });
      }
    };
    
    // Adicionar listener para o evento customizado
    window.addEventListener('profile-image-updated', handleProfileImageUpdated as EventListener);
    
    // Remover listener quando o componente for desmontado
    return () => {
      window.removeEventListener('profile-image-updated', handleProfileImageUpdated as EventListener);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dark-100">
      {/* Div principal */}
      <div className="container mx-auto px-4 py-8">
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
                <div className="flex items-center mb-6">
                  <div className="mr-4">
                    <ProfileImageUpload 
                      currentImage={user?.profileImage} 
                      onUploadSuccess={(imageUrl) => {
                        setUploadedImage(imageUrl);
                        setSuccess('Imagem de perfil atualizada com sucesso');
                      }}
                      userName={user?.username} 
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{user?.name || user?.username}</h3>
                    <div className="mt-1">
                      {user && renderRole(user.role)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Nome de Usuário</p>
                    <p className="font-medium text-white text-sm truncate">{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Email</p>
                    <p className="font-medium text-white text-sm truncate">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Membro desde</p>
                    <p className="font-medium text-white text-sm">
                      {user?.createdAt && user.createdAt !== 'undefined' 
                        ? (() => {
                            try {
                              const date = new Date(user.createdAt);
                              // Verificar se a data é válida
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              } else {
                                console.error("Data inválida:", user.createdAt);
                                return 'Data inválida';
                              }
                            } catch (e) {
                              console.error("Erro ao formatar data:", e);
                              return 'Erro ao processar data';
                            }
                          })()
                        : 'N/A'}
                  </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Número de Membro</p>
                    <p className="font-medium text-white text-sm">{user?.memberNumber ? user.memberNumber : 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Estatísticas de compras */}
              <div className="bg-dark-200 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 text-white">Estatísticas</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-dark-300 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-900/30 text-blue-400 mr-3">
                        <FiShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Pedidos</p>
                        <p className="text-base font-bold text-white">{user?.orders?.count || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-300 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-green-900/30 text-green-400 mr-3">
                        <FiPackage className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Produtos</p>
                        <p className="text-base font-bold text-white">{user?.orders?.products || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-300 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-purple-900/30 text-purple-400 mr-3">
                        <FiDollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-base font-bold text-white">
                         R$ {user?.orders?.total
                           ? Number(user.orders.total).toFixed(2).replace('.', ',')
                           : '0,00'}
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
        </div>
      </div>
    </main>
  );
} 