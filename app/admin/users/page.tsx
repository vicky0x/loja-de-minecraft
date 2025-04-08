'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  FiUser, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, 
  FiCheckCircle, FiUserCheck, FiUserX, FiUsers, FiRefreshCw,
  FiCalendar, FiMail, FiEdit, FiUserPlus, FiShield, FiDatabase, FiCode, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'developer';
  memberNumber: number | null;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isPromotingToAdmin, setIsPromotingToAdmin] = useState(false);
  const [isPromotingToDeveloper, setIsPromotingToDeveloper] = useState(false);
  const [isDemotingToUser, setIsDemotingToUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // Buscar usuários
  const fetchUsers = async (page = 1, searchTerm = search, role = roleFilter) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (role) {
        params.append('role', role);
      }
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao buscar usuários');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Erro ao buscar usuários');
      toast.error(error.message || 'Erro ao buscar usuários');
    } finally {
      setLoading(false);
    }
  };
  
  // Efeito inicial para carregar usuários
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Função para lidar com a pesquisa
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search, roleFilter);
  };
  
  // Função para mudar página
  const changePage = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchUsers(newPage, search, roleFilter);
    }
  };
  
  // Função para promover usuário para admin
  const promoteToAdmin = async (userId: string) => {
    try {
      setIsPromotingToAdmin(true);
      setSelectedUserId(userId);
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: 'admin' }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao promover usuário');
      }
      
      // Atualizar lista
      fetchUsers(pagination.page, search, roleFilter);
      toast.success('Usuário promovido a administrador com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao promover usuário');
    } finally {
      setIsPromotingToAdmin(false);
      setSelectedUserId('');
    }
  };
  
  // Função para promover usuário para desenvolvedor
  const promoteToDeveloper = async (userId: string) => {
    try {
      setIsPromotingToDeveloper(true);
      setSelectedUserId(userId);
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: 'developer' }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao promover usuário');
      }
      
      // Atualizar lista
      fetchUsers(pagination.page, search, roleFilter);
      toast.success('Usuário promovido a desenvolvedor com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao promover usuário');
    } finally {
      setIsPromotingToDeveloper(false);
      setSelectedUserId('');
    }
  };
  
  // Função para rebaixar admin para usuário
  const demoteToUser = async (userId: string) => {
    try {
      setIsDemotingToUser(true);
      setSelectedUserId(userId);
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: 'user' }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao rebaixar administrador');
      }
      
      // Atualizar lista
      fetchUsers(pagination.page, search, roleFilter);
      toast.success('Administrador rebaixado a usuário normal com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rebaixar administrador');
    } finally {
      setIsDemotingToUser(false);
      setSelectedUserId('');
    }
  };
  
  // Interface da página
  return (
    <div className="container mx-auto px-4">
      <div className="mb-6 bg-dark-300 rounded-xl p-6 border border-dark-400/50 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FiUsers className="mr-2 text-primary" size={24} />
            Gerenciar Usuários
          </h1>

          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-dark-400 border border-dark-500 rounded-l-lg py-2 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 bg-dark-500 rounded-r-lg text-white hover:bg-dark-600 transition-colors"
                >
                  <FiSearch />
                </button>
              </div>
            </form>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                fetchUsers(1, search, e.target.value);
              }}
              className="bg-dark-400 border border-dark-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos os tipos</option>
              <option value="user">Usuários</option>
              <option value="developer">Desenvolvedores</option>
              <option value="admin">Administradores</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('');
                fetchUsers(1, '', '');
              }}
              className="bg-dark-400 border border-dark-500 rounded-lg py-2 px-4 text-white hover:bg-dark-500 transition-colors flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Resetar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="bg-dark-300 rounded-xl border border-dark-400/50 shadow-lg overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-400">Carregando usuários...</p>
            </div>
          </div>
        ) : error && users.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <div className="text-center">
              <FiAlertCircle className="mx-auto text-red-500 mb-4" size={40} />
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => fetchUsers()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <div className="text-center">
              <FiUsers className="mx-auto text-gray-500 mb-4" size={40} />
              <p className="text-gray-400 mb-2">Nenhum usuário encontrado</p>
              <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-400">
                <thead className="bg-dark-400">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Membro #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-dark-300 divide-y divide-dark-400">
                  {users.map((user) => (
                    <motion.tr 
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-dark-400/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-dark-500 flex items-center justify-center overflow-hidden mr-3">
                            {user.profileImage ? (
                              <Image
                                src={user.profileImage}
                                alt={user.username}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <FiUser className="text-gray-400" size={20} />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-400">
                              {user.name || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-300">
                          <FiMail className="mr-2 text-gray-500" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'admin' ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-900/30 text-purple-400 border border-purple-800/30">
                            Administrador
                          </span>
                        ) : user.role === 'developer' ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-500 border border-green-800/30">
                            Desenvolvedor
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/30">
                            Usuário
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">
                          <FiDatabase className="mr-2 text-gray-500" />
                          <span className="font-mono">{user._id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.memberNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-300">
                          <FiCalendar className="mr-2 text-gray-500" />
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {user.role === 'user' ? (
                            <>
                              <button
                                onClick={() => promoteToAdmin(user._id)}
                                disabled={isPromotingToAdmin && selectedUserId === user._id}
                                className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-800/30 rounded hover:bg-green-900/50 transition-colors flex items-center"
                                title="Promover a Administrador"
                              >
                                {isPromotingToAdmin && selectedUserId === user._id ? (
                                  <FiRefreshCw className="animate-spin" />
                                ) : (
                                  <FiUserCheck />
                                )}
                                <span className="ml-1 hidden sm:inline">Admin</span>
                              </button>
                              <button
                                onClick={() => promoteToDeveloper(user._id)}
                                disabled={isPromotingToDeveloper && selectedUserId === user._id}
                                className="px-2 py-1 bg-teal-900/30 text-teal-400 border border-teal-800/30 rounded hover:bg-teal-900/50 transition-colors flex items-center"
                                title="Promover a Desenvolvedor"
                              >
                                {isPromotingToDeveloper && selectedUserId === user._id ? (
                                  <FiRefreshCw className="animate-spin" />
                                ) : (
                                  <FiCode />
                                )}
                                <span className="ml-1 hidden sm:inline">Dev</span>
                              </button>
                            </>
                          ) : user.role === 'developer' ? (
                            <>
                              <button
                                onClick={() => promoteToAdmin(user._id)}
                                disabled={isPromotingToAdmin && selectedUserId === user._id}
                                className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-800/30 rounded hover:bg-green-900/50 transition-colors flex items-center"
                                title="Promover a Administrador"
                              >
                                {isPromotingToAdmin && selectedUserId === user._id ? (
                                  <FiRefreshCw className="animate-spin" />
                                ) : (
                                  <FiUserCheck />
                                )}
                                <span className="ml-1 hidden sm:inline">Admin</span>
                              </button>
                              <button
                                onClick={() => demoteToUser(user._id)}
                                disabled={isDemotingToUser && selectedUserId === user._id}
                                className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-800/30 rounded hover:bg-blue-900/50 transition-colors flex items-center"
                                title="Rebaixar para Usuário"
                              >
                                {isDemotingToUser && selectedUserId === user._id ? (
                                  <FiRefreshCw className="animate-spin" />
                                ) : (
                                  <FiUserX />
                                )}
                                <span className="ml-1 hidden sm:inline">Usuário</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => demoteToUser(user._id)}
                              disabled={isDemotingToUser && selectedUserId === user._id}
                              className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-800/30 rounded hover:bg-blue-900/50 transition-colors flex items-center"
                              title="Rebaixar para Usuário"
                            >
                              {isDemotingToUser && selectedUserId === user._id ? (
                                <FiRefreshCw className="animate-spin" />
                              ) : (
                                <FiUserX />
                              )}
                              <span className="ml-1 hidden sm:inline">Rebaixar</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => router.push(`/admin/users/${user._id}`)}
                            className="px-2 py-1 bg-dark-500/80 text-gray-300 border border-dark-600/50 rounded hover:bg-dark-500 transition-colors flex items-center"
                            title="Editar Usuário"
                          >
                            <FiEdit />
                            <span className="ml-1 hidden sm:inline">Detalhes</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 bg-dark-400/50 border-t border-dark-500 flex flex-col sm:flex-row justify-between items-center">
                <div className="text-sm text-gray-400 mb-4 sm:mb-0">
                  Mostrando <span className="font-medium text-white">{users.length}</span> de <span className="font-medium text-white">{pagination.total}</span> usuários
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => changePage(1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === 1
                        ? 'bg-dark-500/50 text-gray-500 cursor-not-allowed'
                        : 'bg-dark-500 text-gray-300 hover:bg-dark-600 hover:text-white'
                    }`}
                  >
                    Primeira
                  </button>
                  
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === 1
                        ? 'bg-dark-500/50 text-gray-500 cursor-not-allowed'
                        : 'bg-dark-500 text-gray-300 hover:bg-dark-600 hover:text-white'
                    }`}
                  >
                    <FiChevronLeft />
                  </button>
                  
                  <div className="px-3 py-1 bg-primary text-white rounded-md">
                    {pagination.page}
                  </div>
                  
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === pagination.pages
                        ? 'bg-dark-500/50 text-gray-500 cursor-not-allowed'
                        : 'bg-dark-500 text-gray-300 hover:bg-dark-600 hover:text-white'
                    }`}
                  >
                    <FiChevronRight />
                  </button>
                  
                  <button
                    onClick={() => changePage(pagination.pages)}
                    disabled={pagination.page === pagination.pages}
                    className={`px-3 py-1 rounded-md ${
                      pagination.page === pagination.pages
                        ? 'bg-dark-500/50 text-gray-500 cursor-not-allowed'
                        : 'bg-dark-500 text-gray-300 hover:bg-dark-600 hover:text-white'
                    }`}
                  >
                    Última
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 