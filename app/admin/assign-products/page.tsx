'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSearch, FiSend, FiAlertCircle, FiCheckCircle, FiUser, FiPackage, FiClock, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para o modelo
interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  variants: {
    _id: string;
    name: string;
    stock: number;
  }[];
}

interface Assignment {
  _id: string;
  code: string;
  assignedAt: string;
  product: {
    _id: string;
    name: string;
    slug: string;
  };
  variant: {
    _id: string;
    name: string;
    price: number;
  };
  user: {
    _id: string;
    username: string;
    email: string;
    name: string;
  };
  assignedBy: {
    _id?: string;
    username: string;
    email: string;
  };
  metadata: Record<string, any>;
}

export default function AssignProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para pesquisa de usuário
  const [userQuery, setUserQuery] = useState('');
  const [userSearching, setUserSearching] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Estados para seleção de produto
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // Estados para histórico de atribuições
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentPages, setAssignmentPages] = useState(1);
  const [assignmentTotal, setAssignmentTotal] = useState(0);
  const [assignmentLimit] = useState(10);
  
  // Carregar produtos ao inicializar a página
  useEffect(() => {
    loadProducts();
    fetchAssignments(1);
  }, []);
  
  // Função para carregar a lista de produtos
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/products?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Função para buscar histórico de atribuições
  const fetchAssignments = async (page: number) => {
    try {
      setLoadingAssignments(true);
      const response = await fetch(`/api/admin/assignments?page=${page}&limit=${assignmentLimit}`);
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
        setAssignmentPage(data.pagination.page);
        setAssignmentPages(data.pagination.pages);
        setAssignmentTotal(data.pagination.total);
      } else {
        console.error('Erro ao carregar histórico de atribuições');
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de atribuições:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Paginação para histórico de atribuições
  const handlePreviousPage = () => {
    if (assignmentPage > 1) {
      fetchAssignments(assignmentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (assignmentPage < assignmentPages) {
      fetchAssignments(assignmentPage + 1);
    }
  };
  
  // Função para buscar usuário por email ou ID
  const searchUsers = async () => {
    if (!userQuery.trim()) {
      setError('Digite um email ou ID de usuário para pesquisar');
      return;
    }
    
    try {
      setUserSearching(true);
      setError('');
      setUserSearchResults([]);
      
      console.log('Buscando usuário:', userQuery);
      
      // Verificar se parece ser um ID (24 caracteres hexadecimais)
      const isIdFormat = /^[0-9a-fA-F]{24}$/.test(userQuery.trim());
      console.log('Formato parece ser um ID?', isIdFormat);
      
      const url = `/api/admin/users/search?query=${encodeURIComponent(userQuery.trim())}`;
      console.log('URL de busca:', url);
      
      const response = await fetch(url);
      console.log('Status da resposta:', response.status);
      
      const data = await response.json();
      console.log('Dados da resposta:', data);
      
      if (response.ok) {
        setUserSearchResults(data.users || []);
        
        if (data.users.length === 0) {
          let errorMsg = 'Nenhum usuário encontrado com este termo de pesquisa';
          if (isIdFormat) {
            errorMsg += '. Verifique se o ID está correto ou tente buscar pelo email.';
          }
          setError(errorMsg);
        }
      } else {
        setError(data.message || 'Erro ao pesquisar usuários');
      }
    } catch (error) {
      console.error('Erro ao pesquisar usuários:', error);
      setError('Erro ao pesquisar usuários. Por favor, tente novamente.');
    } finally {
      setUserSearching(false);
    }
  };
  
  // Handler para quando o usuário pressiona Enter no campo de busca
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };
  
  // Função para selecionar um usuário da lista de resultados
  const selectUser = (user: User) => {
    setSelectedUser(user);
    setUserSearchResults([]);
  };
  
  // Atualização da função para selecionar produto
  useEffect(() => {
    // Se o produto selecionado não tiver variantes, definir automaticamente a variante como "no-variant"
    if (selectedProduct) {
      const product = products.find(p => p._id === selectedProduct);
      const hasVariants = product?.variants && product.variants.length > 0;
      
      if (!hasVariants) {
        setSelectedVariant('no-variant');
      } else {
        setSelectedVariant(''); // Resetar a variante se o produto tiver variantes
      }
    }
  }, [selectedProduct, products]);
  
  // Função para atribuir o produto ao usuário
  const assignProductToUser = async () => {
    if (!selectedUser) {
      setError('Selecione um usuário primeiro');
      return;
    }
    
    if (!selectedProduct) {
      setError('Selecione um produto');
      return;
    }
    
    // Verificar se o produto tem variantes
    const productData = products.find(p => p._id === selectedProduct);
    const hasVariants = productData?.variants && productData.variants.length > 0;
    
    // Verificar o campo de variante apenas se o produto tiver variantes
    if (hasVariants && !selectedVariant) {
      setError('Selecione uma variante do produto');
      return;
    }
    
    if (quantity <= 0) {
      setError('A quantidade deve ser maior que zero');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const requestData = {
        productId: selectedProduct,
        variantId: hasVariants ? selectedVariant : null, // Enviar null para produtos sem variantes
        userId: selectedUser._id,
        quantity: quantity
      };
      
      console.log('Enviando dados para atribuição:', requestData);
      
      const response = await fetch('/api/stock/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include' // Importante para assegurar que os cookies sejam enviados
      });
      
      const data = await response.json();
      console.log('Resposta da atribuição:', data);
      
      if (response.ok) {
        setSuccess(`Produto atribuído com sucesso para ${selectedUser.username}`);
        
        // Resetar os campos após atribuição bem-sucedida
        setSelectedProduct('');
        setSelectedVariant('');
        setQuantity(1);
        
        // Atualizar o histórico de atribuições
        fetchAssignments(1);
      } else {
        // Mensagens mais detalhadas para erros específicos
        let mensagemErro = data.message || 'Erro ao atribuir produto ao usuário';
        
        if (response.status === 400 && data.message === 'Estoque insuficiente') {
          mensagemErro = `Estoque insuficiente. Solicitado: ${data.requested}, Disponível: ${data.available}`;
          
          // Verificar se o estoque exibido está correto
          if (productData && productData.variants.length > 0) {
            const estoqueExibido = productData.variants[0].stock;
            console.log(`Estoque exibido: ${estoqueExibido}, Estoque real disponível: ${data.available}`);
            
            if (estoqueExibido !== data.available) {
              mensagemErro += `. Nota: O estoque exibido (${estoqueExibido}) está diferente do estoque real (${data.available}).`;
            }
          }
        } else if (response.status === 401) {
          mensagemErro = 'Sua sessão expirou. Por favor, faça login novamente.';
        } else if (response.status === 403) {
          mensagemErro = 'Você não tem permissão para atribuir produtos.';
        }
        
        setError(mensagemErro);
      }
    } catch (error) {
      console.error('Erro ao atribuir produto:', error);
      setError('Erro ao atribuir produto. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Obter o produto selecionado
  const selectedProductData = products.find(p => p._id === selectedProduct);
  const hasVariants = selectedProductData?.variants && selectedProductData.variants.length > 0;
  const selectedVariantData = selectedProductData?.variants.find(v => v._id === selectedVariant);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Atribuir Produtos a Usuários</h2>
        <Link 
          href="/admin/products" 
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Produtos
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      <div className="bg-dark-200 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <FiUser className="mr-2" />
          Buscar Usuário
        </h3>
        
        <div className="mb-6">
          <div className="flex">
            <input 
              type="text" 
              placeholder="Email ou ID do usuário" 
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={searchUsers}
              disabled={userSearching || !userQuery.trim()}
              className={`bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-r-md flex items-center ${
                userSearching || !userQuery.trim() ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {userSearching ? (
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
              ) : (
                <FiSearch />
              )}
              <span className="ml-2">Buscar</span>
            </button>
          </div>
          
          {userSearchResults.length > 0 && (
            <div className="mt-4 bg-dark-300 rounded-md border border-dark-400 max-h-60 overflow-y-auto">
              <ul className="divide-y divide-dark-400">
                {userSearchResults.map((user) => (
                  <li 
                    key={user._id} 
                    className="p-3 hover:bg-dark-400 cursor-pointer transition-colors"
                    onClick={() => selectUser(user)}
                  >
                    <div className="font-medium text-white">{user.username}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {user._id}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {selectedUser && (
            <div className="mt-4 p-4 bg-dark-300 rounded-md border border-primary">
              <h4 className="text-md font-medium text-white mb-2">Usuário Selecionado</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Nome de usuário:</span>
                  <div className="text-white">{selectedUser.username}</div>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <div className="text-white">{selectedUser.email}</div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <span className="text-gray-400">ID:</span>
                  <div className="text-white font-mono text-xs bg-dark-400 p-1 rounded mt-1">
                    {selectedUser._id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="mt-3 text-primary text-sm hover:underline"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-dark-300 rounded-md">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <FiPackage className="mr-2" />
            Selecionar Produto
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-300 mb-1">
                Produto <span className="text-red-500">*</span>
              </label>
              <select
                id="product"
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setSelectedVariant('');
                }}
                className="w-full px-3 py-2 bg-dark-400 text-white border border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loadingProducts}
              >
                <option value="">Selecione um produto</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedProduct && hasVariants && (
              <div>
                <label htmlFor="variant" className="block text-sm font-medium text-gray-300 mb-1">
                  Variante <span className="text-red-500">*</span>
                </label>
                <select
                  id="variant"
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-400 text-white border border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione uma variante</option>
                  {selectedProductData?.variants.map((variant) => (
                    <option 
                      key={variant._id} 
                      value={variant._id}
                      disabled={variant.stock <= 0}
                    >
                      {variant.name} - {variant.stock === 99999 ? 'Grande estoque disponível' : `${variant.stock} em estoque`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedProduct && !hasVariants && (
              <div>
                <div className="block text-sm font-medium text-gray-300 mb-1">Variante</div>
                <div className="p-2 bg-dark-400 text-gray-400 rounded-md">
                  Este produto não possui variantes
                </div>
                <input type="hidden" name="variant" value="no-variant" />
              </div>
            )}
            
            {(selectedVariant || (!hasVariants && selectedProduct)) && (
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">
                  Quantidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-dark-400 text-white border border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={assignProductToUser}
            disabled={loading || !selectedUser || !selectedProduct || (hasVariants && !selectedVariant) || quantity <= 0}
            className={`bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-md flex items-center ${
              loading || !selectedUser || !selectedProduct || (hasVariants && !selectedVariant) || quantity <= 0 ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                Atribuindo...
              </>
            ) : (
              <>
                <FiSend className="mr-2" />
                Atribuir Produto
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Histórico de Atribuições Recentes */}
      <div className="bg-dark-200 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <FiClock className="mr-2" />
          Histórico de Atribuições Recentes
        </h3>
        
        <div className="overflow-x-auto">
          {loadingAssignments ? (
            <div className="flex justify-center py-6">
              <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></span>
              <span className="ml-2 text-gray-400">Carregando histórico de atribuições...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-6 text-center text-gray-400">
              <FiList className="mx-auto h-8 w-8 mb-2" />
              <p>Nenhuma atribuição de produto encontrada.</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-dark-400">
                <thead className="bg-dark-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Produto
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Plano
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Atribuído Por
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-dark-300 divide-y divide-dark-400">
                  {assignments.map((assignment) => (
                    <tr key={assignment._id} className="hover:bg-dark-400">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(assignment.assignedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{assignment.user?.username || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{assignment.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {assignment.product?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {assignment.variant?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-300">
                        {assignment.code || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {assignment.assignedBy?.username || 'Sistema'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Paginação */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-sm text-gray-400">
                  Mostrando {assignments.length} de {assignmentTotal} atribuições
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={assignmentPage <= 1}
                    className={`p-2 rounded-md flex items-center ${
                      assignmentPage <= 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-dark-400'
                    }`}
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <span className="px-2 text-sm text-gray-400">
                    Página {assignmentPage} de {assignmentPages || 1}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={assignmentPage >= assignmentPages}
                    className={`p-2 rounded-md flex items-center ${
                      assignmentPage >= assignmentPages ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-dark-400'
                    }`}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 