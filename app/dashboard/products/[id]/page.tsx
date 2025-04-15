'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiDownload, FiCopy, FiCheck, FiAlertCircle, FiShare2, FiLock } from 'react-icons/fi';
import { formatProductName } from '@/app/utils/formatters';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/app/layouts/DashboardLayout';

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

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [productId, setProductId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  
  // Buscar o ID do produto a partir dos parâmetros da rota
  useEffect(() => {
    if (params && params.id) {
      // O parâmetro id pode ser um array no Next.js, então garantimos que pegamos o primeiro valor
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      setProductId(id);
    }
  }, [params]);
  
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
      
      // Definir imagem principal
      const productData = { 
        ...data.product, 
        statusClass,
        status: statusText,
        assignedAt: assignedAtString
      };
      
      // Definir a imagem atual com a primeira imagem disponível
      const defaultImage = productData.image || 
                          (productData.images && productData.images.length > 0 ? 
                           productData.images[0] : null);
      
      setCurrentImage(defaultImage);
      setProduct(productData);
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
            <div className="w-full md:w-2/5 lg:w-1/3">
              <div className="relative w-full aspect-video bg-dark-300 rounded-lg overflow-hidden">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    className="transition-opacity"
                    priority={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Galeria de imagens adicionais */}
              {product.images && product.images.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-1">
                  {product.images.map((img, index) => (
                    <div 
                      key={index} 
                      className={`relative h-14 bg-dark-300 rounded-md overflow-hidden cursor-pointer ${currentImage === img ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setCurrentImage(img)}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} - Imagem ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="hover:opacity-80 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Informações do produto */}
            <div className="flex-1">
              <div className="mt-4">
                <h1 className="text-3xl font-bold text-white">
                  {formatProductName(product.name)}
                </h1>
                
                {product.variant && (
                  <p className="text-gray-400 mt-2 text-lg">
                    Variante: {product.variant.name}
                  </p>
                )}
                
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
              </div>
              
              <div className="mt-6 space-y-4">
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
                  <div className="mt-2 text-sm text-amber-400/80 bg-amber-900/20 p-2 rounded border border-amber-700/30">
                    <p className="flex items-start">
                      <FiAlertCircle className="mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Formato da conta:</strong> A parte antes do símbolo | é o <strong>email da conta</strong>, e a parte após o símbolo | é o <strong>código de recuperação</strong> de 25 dígitos.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Tutorial */}
        <div className="border-t border-dark-300 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Tutorial de Acesso</h2>
          
          {/* Aviso inicial destacado */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-l-4 border-purple-500 p-4 mb-6 text-white">
            <h4 className="font-bold text-xl mb-2">⚠️ ATENÇÃO!</h4>
            <p className="text-lg">
              Para acessar sua conta com sucesso, <span className="font-bold text-primary">assista ao vídeo tutorial completo</span> e leia 
              <span className="font-bold text-primary"> todo o passo a passo</span> abaixo com atenção.
            </p>
            <p className="mt-2">
              Seguir corretamente estas instruções garantirá que você consiga acessar sua conta sem problemas.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Vídeo Tutorial - Substituído por card informativo */}
            <div className="bg-dark-300 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary mb-3">Vídeo Tutorial: Como Acessar a Conta</h3>
              
              <div className="bg-dark-400/50 p-5 rounded-lg text-center">
                <p className="text-white mb-4">
                  Assista ao vídeo tutorial completo no YouTube para aprender como acessar sua conta corretamente.
                </p>
                
                <a 
                  href="https://www.youtube.com/watch?v=A-sZWDlYBF8" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-md inline-flex items-center gap-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                  <span>Assistir no YouTube</span>
                </a>
              </div>
            </div>
            
            {/* Avisos Importantes */}
            <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 text-blue-300">
              <h4 className="font-bold mb-2 text-blue-200">⚠️ Avisos Importantes</h4>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Caso seja solicitada verificação por email, clique em "Usar outro meio de verificação" → "Tenho um código" → "Não tenho nenhuma".</li>
                <li>Isso liberará o campo para utilizar o código de recuperação de 25 dígitos.</li>
                <li>Se o erro persistir, troque de navegador e acesse a conta através da guia anônima/privativa.</li>
                <li>Não compartilhe o código com ninguém, pois ele dá acesso completo à conta.</li>
              </ul>
            </div>
            
            {/* Tutorial Passo a Passo */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Passo a Passo Detalhado</h3>
              
              {/* Acessar a conta */}
              <div className="bg-dark-300 rounded-lg p-4">
                <h4 className="text-lg font-medium text-primary mb-2">1. Como Acessar a Conta com o Código de Recuperação</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Acesse o site <a href="https://www.minecraft.net/login" target="_blank" className="text-primary hover:underline">https://www.minecraft.net/login</a></li>
                  <li>Clique em "Entrar com a Microsoft"</li>
                  <li>Digite o email da conta fornecido no código acima</li>
                  <li>Na tela de senha, clique em "Esqueci minha senha"</li>
                  <li>Na tela seguinte, selecione "Tenho um código de recuperação"</li>
                  <li>Insira o código de 25 dígitos (mostrado acima)</li>
                  <li>Defina uma nova senha para a conta</li>
                  <li>Prossiga com o login normalmente</li>
                </ol>
                <p className="mt-3 text-yellow-300">⚠️ Se pedir verificação, clique em "Usar outro meio de verificação" → "Tenho um código" → "Não tenho nenhuma"</p>
              </div>
              
              {/* Alterar senha e email */}
              <div className="bg-dark-300 rounded-lg p-4">
                <h4 className="text-lg font-medium text-primary mb-2">2. Como Alterar Senha e Email</h4>
                <h5 className="font-medium text-gray-300 mt-3">Alterando a Senha:</h5>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Após login, acesse <a href="https://account.microsoft.com/security" target="_blank" className="text-primary hover:underline">https://account.microsoft.com/security</a></li>
                  <li>Clique em "Alterar senha"</li>
                  <li>Siga as instruções para criar e confirmar sua nova senha</li>
                </ol>
                
                <h5 className="font-medium text-gray-300 mt-3">Alterando o Email da Conta Microsoft:</h5>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Acesse <a href="https://account.microsoft.com/profile" target="_blank" className="text-primary hover:underline">https://account.microsoft.com/profile</a></li>
                  <li>Clique em "Gerenciar como você entra na Microsoft"</li>
                  <li>Selecione "Adicionar email"</li>
                  <li>Adicione seu novo email e defina-o como principal</li>
                  <li>Após confirmar o novo email, você pode remover o email antigo</li>
                </ol>
                
                <p className="mt-3 text-yellow-300">⚠️ Importante: Após alterar o email, certifique-se de que consegue fazer login antes de remover o email antigo.</p>
              </div>
              
              {/* Alterar skin e capa */}
              <div className="bg-dark-300 rounded-lg p-4">
                <h4 className="text-lg font-medium text-primary mb-2">3. Como Alterar Skin e Capa do Minecraft</h4>
                
                <h5 className="font-medium text-gray-300 mt-3">Alterando a Skin:</h5>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Acesse <a href="https://www.minecraft.net/profile" target="_blank" className="text-primary hover:underline">https://www.minecraft.net/profile</a> e faça login</li>
                  <li>Na seção "Skin", clique em "Procurar" para carregar uma nova skin</li>
                  <li>Selecione o modelo (clássico ou esbelto)</li>
                  <li>Clique em "Carregar" para aplicar</li>
                </ol>
                
                <h5 className="font-medium text-gray-300 mt-3">Alterando a Capa (apenas para Java Edition):</h5>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Acesse <a href="https://www.minecraft.net/profile" target="_blank" className="text-primary hover:underline">https://www.minecraft.net/profile</a> e faça login</li>
                  <li>Na seção "Capa", clique em "Procurar" para carregar uma nova capa</li>
                  <li>Selecione um arquivo .PNG com as dimensões corretas (64x32)</li>
                  <li>Clique em "Carregar" para aplicar</li>
                </ol>
                
                <p className="mt-3 text-gray-400 italic">Dica: Você pode encontrar skins e capas gratuitas em sites como MinecraftSkins.com ou PMCSkin3D.</p>
              </div>
              
              {/* Solução de problemas */}
              <div className="bg-dark-300 rounded-lg p-4">
                <h4 className="text-lg font-medium text-primary mb-2">4. Solução de Problemas Comuns</h4>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-300">Problema: "Não consigo fazer login com o código"</h5>
                    <p className="text-gray-400 pl-4">Solução: Tente usar o navegador em modo anônimo/privativo ou tente outro navegador.</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-300">Problema: "Aparece verificação de segurança"</h5>
                    <p className="text-gray-400 pl-4">Solução: Clique em "Usar outro meio de verificação" → "Tenho um código" → "Não tenho nenhuma".</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-300">Problema: "Código de recuperação não aceito"</h5>
                    <p className="text-gray-400 pl-4">Solução: Verifique se digitou corretamente, respeitando letras maiúsculas e minúsculas.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Suporte */}
            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="text-lg font-medium text-primary mb-2">Precisa de Ajuda?</h4>
              <p className="text-gray-300">Se você encontrar qualquer dificuldade no processo, entre em contato com nosso suporte:</p>
              <Link 
                href="/dashboard/support" 
                className="inline-block mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Contatar Suporte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 