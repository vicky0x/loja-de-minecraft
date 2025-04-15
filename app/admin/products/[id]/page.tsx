'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiLoader } from 'react-icons/fi';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID do produto inválido');
      setLoading(false);
      return;
    }
    
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados do produto');
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        setError('Não foi possível carregar os dados do produto. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
        {error || 'Produto não encontrado'}
        <div className="mt-4">
          <button 
            onClick={() => router.push('/admin/products')}
            className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Voltar para Produtos
          </button>
        </div>
      </div>
    );
  }

  // Formatar preço base
  const basePrice = product.variants && product.variants.length > 0
    ? Math.min(...product.variants.map((v: any) => v.price))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Detalhes do Produto</h2>
        <Link 
          href="/admin/products" 
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Produtos
        </Link>
      </div>

      <div className="bg-dark-200 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-white mb-4">{product.name}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna de imagens */}
          <div>
            <h4 className="text-lg font-medium text-white mb-2">Imagens</h4>
            <div className="grid grid-cols-2 gap-2">
              {product.images && product.images.length > 0 ? (
                product.images.map((image: string, index: number) => (
                  <div key={index} className="bg-dark-300 rounded-md overflow-hidden h-32 flex items-center justify-center">
                    {image.startsWith('data:') ? (
                      <img src={image} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                    ) : image.startsWith('/uploads/') ? (
                      <img src={image} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                    ) : image.startsWith('http') ? (
                      <img src={image} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400 p-2 flex flex-col items-center justify-center w-full h-full">
                        <div className="text-xs overflow-hidden max-w-full text-ellipsis">{image.split('/').pop() || image}</div>
                        <div className="text-xs text-primary mt-1">Imagem não disponível</div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-dark-300 rounded-md h-32 flex items-center justify-center text-gray-400">
                  Sem imagens
                </div>
              )}
            </div>
          </div>
          
          {/* Coluna de informações */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Informações Básicas</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><span className="text-gray-400">Slug:</span> {product.slug}</li>
                  <li><span className="text-gray-400">Categoria:</span> {product.category?.name || 'Sem categoria'}</li>
                  <li><span className="text-gray-400">Preço base:</span> R$ {basePrice.toFixed(2).replace('.', ',')}</li>
                  <li><span className="text-gray-400">Destaque:</span> {product.featured ? 'Sim' : 'Não'}</li>
                  <li><span className="text-gray-400">Criado em:</span> {new Date(product.createdAt).toLocaleDateString('pt-BR')}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Descrição Curta</h4>
                {product.shortDescription ? (
                  <p className="text-gray-300">{product.shortDescription}</p>
                ) : (
                  <p className="text-gray-400 italic">Não definida</p>
                )}
              </div>
            </div>
            
            {/* Descrição completa */}
            <div className="mt-4">
              <h4 className="text-lg font-medium text-white mb-2">Descrição Completa</h4>
              <div className="bg-dark-300 p-3 rounded-md text-gray-300">
                {product.description}
              </div>
            </div>
            
            {/* Planos/Variantes */}
            <div className="mt-4">
              <h4 className="text-lg font-medium text-white mb-2">
                {product.variants && product.variants.length > 0 
                  ? `Planos (${product.variants.length})` 
                  : 'Preço e Estoque'}
              </h4>
              {product.variants && product.variants.length > 0 ? (
                <div className="space-y-3">
                  {product.variants.map((variant: any, index: number) => (
                    <div key={index} className="bg-dark-300 p-3 rounded-md">
                      <div className="flex justify-between">
                        <h5 className="font-medium text-white">{variant.name}</h5>
                        <span className="text-primary">R$ {variant.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{variant.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div>
                          {variant.features && variant.features.length > 0 && (
                            <ul className="space-y-1">
                              {variant.features.map((feature: string, idx: number) => (
                                <li key={idx} className="text-gray-300 text-sm">• {feature}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Estoque: </span>
                          <span className={
                            variant.stock > 10 
                              ? 'text-green-400' 
                              : variant.stock > 0 
                                ? 'text-yellow-400' 
                                : 'text-red-400'
                          }>
                            {variant.stock === 99999 ? 'Grande estoque' : variant.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : product.price !== undefined ? (
                <div className="bg-dark-300 p-3 rounded-md">
                  <div className="flex justify-between">
                    <h5 className="font-medium text-white">Preço único</h5>
                    <span className="text-primary">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <div className="text-sm">
                      <span className="text-gray-400">Estoque: </span>
                      <span className={
                        product.stock > 10 
                          ? 'text-green-400' 
                          : product.stock > 0 
                            ? 'text-yellow-400' 
                            : 'text-red-400'
                      }>
                        {product.stock === 99999 ? 'Grande estoque' : product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-dark-300 p-3 rounded-md text-gray-400">
                  Nenhum plano cadastrado
                </div>
              )}
            </div>
            
            {/* Requisitos */}
            <div className="mt-4">
              <h4 className="text-lg font-medium text-white mb-2">Requisitos do Sistema</h4>
              {product.requirements && product.requirements.length > 0 ? (
                <ul className="bg-dark-300 p-3 rounded-md text-gray-300 space-y-1">
                  {product.requirements.map((req: string, index: number) => (
                    <li key={index}>• {req}</li>
                  ))}
                </ul>
              ) : (
                <div className="bg-dark-300 p-3 rounded-md text-gray-400">
                  Nenhum requisito cadastrado
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="mt-6 flex justify-end space-x-4">
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md flex items-center"
            onClick={() => router.push(`/admin/products/${id}/stock`)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Gerenciar Estoque
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
            onClick={() => router.push(`/admin/products/${id}/edit`)}
          >
            <FiSave className="mr-2" />
            Editar Produto
          </button>
        </div>
      </div>
    </div>
  );
} 