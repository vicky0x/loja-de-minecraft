'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiDownload, FiCopy, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface ProductDetail {
  _id: string;
  productId: string;
  name: string;
  image: string;
  images: string[];
  status: string;
  code: string;
  assignedAt: string;
  variant: {
    _id: string;
    name: string;
  };
  statusClass: string;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const [productId, setProductId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Buscar o ID do produto a partir dos parâmetros da rota
  useEffect(() => {
    if (routeParams && routeParams.id) {
      // O parâmetro id pode ser um array no Next.js, então garantimos que pegamos o primeiro valor
      const id = Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id;
      setProductId(id);
    }
  }, [routeParams]);
  
  // Buscar detalhes do produto do usuário quando o ID estiver disponível
  useEffect(() => {
    if (productId) {
      try {
        fetchProductDetails(productId);
      } catch (error) {
        console.error('Erro ao inicializar detalhes do produto:', error);
        setError('Erro ao carregar detalhes do produto. Por favor, tente novamente.');
        setLoading(false);
      }
    }
  }, [productId]);
  
  const fetchProductDetails = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/user/products/${id}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao carregar detalhes do produto');
      }
      
      const data = await response.json();
      
      // Verificar se a data de atribuição é válida (não deve ser anterior a 2020)
      let assignedAtString = data.product.assignedAt;
      const assignedAtDate = new Date(data.product.assignedAt);
      
      if (!assignedAtDate || isNaN(assignedAtDate.getTime()) || assignedAtDate.getFullYear() < 2020) {
        console.error('Data de atribuição inválida:', assignedAtDate);
        // Usar a data atual como fallback
        assignedAtString = new Date().toISOString();
      }
      
      // Mapear classes de status apenas se o status estiver definido
      let statusClass = '';
      let statusText = '';
      
      if (data.product.status) {
        statusText = data.product.status;
        statusClass = 
          data.product.status === 'Ativo' ? 'bg-green-900/30 text-green-400' : 
          data.product.status === 'Em Manutenção' ? 'bg-yellow-900/30 text-yellow-400' : 
          data.product.status === 'Beta' ? 'bg-blue-900/30 text-blue-400' : 
          'bg-red-900/30 text-red-400';
      }
      
      setProduct({ 
        ...data.product, 
        statusClass,
        status: statusText,
        assignedAt: assignedAtString
      });
    } catch (error: any) {
      console.error('Erro ao carregar detalhes do produto:', error);
      setError(error.message || 'Erro ao carregar detalhes do produto');
      setProduct(null); // Definir como null para evitar erros
    } finally {
      setLoading(false);
    }
  };
  
  const copyProductCode = () => {
    if (!product) return;
    
    navigator.clipboard.writeText(product.code);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Função para formatar data de forma segura
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Verificar se a data é válida e posterior a 2020
      if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
        return new Date().toLocaleDateString('pt-BR');
      }
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return new Date().toLocaleDateString('pt-BR');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Detalhes do Produto</h2>
          <Link 
            href="/dashboard" 
            className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Voltar para Dashboard
          </Link>
        </div>
        
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Detalhes do Produto</h2>
          <Link 
            href="/dashboard" 
            className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Voltar para Dashboard
          </Link>
        </div>
        
        <div className="bg-dark-200 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-400">Produto não encontrado ou você não tem acesso a ele.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Detalhes do Produto</h2>
        <Link 
          href="/dashboard" 
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Dashboard
        </Link>
      </div>
      
      <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
        {/* Seção de cabeçalho do produto */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Imagem do produto */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="relative w-full h-64 bg-dark-300 rounded-lg overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform hover:scale-105"
                    unoptimized={true}
                    priority={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Informações do produto */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{product.name}</h1>
              
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {product.status && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.statusClass}`}>
                    {product.status}
                  </span>
                )}
                
                <span className="text-gray-400 text-sm">
                  Adquirido em: {formatDate(product.assignedAt)}
                </span>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-300">Variante:</h3>
                  <p className="text-white">{product.variant?.name || 'Padrão'}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-300">Informações da conta:</h3>
                  <div className="bg-dark-300 rounded-md p-3 flex justify-between items-center mt-1">
                    <code className="text-primary font-mono text-sm lg:text-base">{product.code}</code>
                    <button
                      onClick={copyProductCode}
                      className="ml-2 px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-md flex items-center transition-colors"
                    >
                      {copied ? (
                        <>
                          <FiCheck className="mr-1" />
                          <span className="text-sm">Copiado</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="mr-1" />
                          <span className="text-sm">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 