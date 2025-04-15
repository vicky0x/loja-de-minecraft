'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiTrash2, FiUpload, FiX, FiSave, FiLoader, FiShield, FiClock, FiAward, FiSlash } from 'react-icons/fi';
import RichTextEditor from '@/app/components/RichTextEditor';
import { toast } from 'react-hot-toast';
import RadioButton, { RadioGroup } from '@/app/components/ui/RadioButton';

interface Variant {
  name: string;
  description: string;
  price: number;
  stock: number;
  features: string[];
  deliveryType: string;
}

interface CategoryOption {
  _id: string;
  name: string;
}

interface ProductData {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  featured: boolean;
  images: string[];
  variants: Variant[];
  requirements: string[];
  status: string;
  deliveryType: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);

  // Estado para dados do produto
  const [productData, setProductData] = useState({
    name: '',
    category: '',
    short_description: '',
    description: '',
    is_featured: false,
    status: '',
    useVariants: true, // Controla se o produto usa variantes ou não
    price: 0, // Preço quando não usa variantes
    stock: 0, // Estoque quando não usa variantes
    originalPrice: 0, // Preço original para exibir desconto
    discountPercentage: 0, // Porcentagem de desconto
    deliveryType: 'automatic', // Tipo de entrega: automática ou manual
  });

  const [variants, setVariants] = useState<Variant[]>([{
    name: '',
    description: '',
    price: 0,
    stock: 0,
    features: [''],
    deliveryType: 'automatic', // Tipo de entrega para a variante
  }]);
  
  const [images, setImages] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Estados para requisitos do sistema
  const [requirements, setRequirements] = useState({
    sistema_operacional: '',
    processador: '',
    memoria: '',
    placa_grafica: '',
    armazenamento: '',
    notas_adicionais: '',
  });

  useEffect(() => {
    // Carregar categorias ao montar o componente
    fetchCategories();
    
    // Carregar dados do produto
    fetchProductData();
  }, []);

  async function fetchCategories() {
    try {
      setCategoryLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error('Erro ao carregar categorias');
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setCategoryLoading(false);
    }
  }
  
  async function fetchProductData() {
    try {
      setProductLoading(true);
      const response = await fetch(`/api/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do produto');
      }
      
      const data = await response.json();
      
      if (data.product) {
        const product = data.product;
        
        setProductData({
          name: product.name || '',
          category: product.category?._id || '',
          short_description: product.shortDescription || '',
          description: product.description || '',
          is_featured: product.featured || false,
          status: product.status || '',
          useVariants: Array.isArray(product.variants) && product.variants.length > 0, // Verifica se usa variantes
          price: product.price || 0, // Preço do produto quando não usa variantes
          stock: product.stock || 0, // Estoque do produto quando não usa variantes
          originalPrice: product.originalPrice || 0, // Preço original para exibir desconto
          discountPercentage: product.discountPercentage || 0, // Porcentagem de desconto
          deliveryType: product.deliveryType || 'automatic', // Tipo de entrega
        });
        
        if (product.variants && product.variants.length > 0) {
          setVariants(product.variants.map((v: any) => ({
            _id: v._id,
            name: v.name || '',
            description: v.description || '',
            price: v.price || 0,
            stock: v.stock || 0,
            features: v.features || [''],
            deliveryType: v.deliveryType || 'automatic',
          })));
        }
        
        // Configurar imagens
        if (product.images && product.images.length > 0) {
          setImages(product.images);
          
          // Criar previews para imagens existentes
          const previews = product.images.map((img: string) => {
            if (img.startsWith('data:')) {
              return img;
            } else if (img.startsWith('/uploads/') || img.startsWith('http')) {
              return img;
            } else {
              return '/placeholder-image.jpg';
            }
          });
          
          setPreviewImages(previews);
        }
        
        // Configurar requisitos
        if (product.requirements && product.requirements.length > 0) {
          const reqObj: any = {};
          
          // Mapeamento de rótulos em português para nomes de campos
          const labelMapping: Record<string, string> = {
            'Sistema Operacional': 'sistema_operacional',
            'Processador': 'processador',
            'Memória': 'memoria',
            'Placa de Vídeo': 'placa_grafica',
            'Armazenamento': 'armazenamento',
            'Notas Adicionais': 'notas_adicionais',
            // Compatibilidade com formatos antigos
            'operating_system': 'sistema_operacional',
            'processor': 'processador',
            'memory': 'memoria',
            'graphics': 'placa_grafica',
            'storage': 'armazenamento',
            'additional_notes': 'notas_adicionais'
          };
          
          product.requirements.forEach((req: string) => {
            const parts = req.split(':');
            if (parts.length > 1) {
              const label = parts[0].trim();
              const value = parts[1].trim();
              const fieldName = labelMapping[label] || label.toLowerCase().replace(/ /g, '_');
              reqObj[fieldName] = value;
            }
          });
          
          setRequirements({...requirements, ...reqObj});
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      setError('Não foi possível carregar os dados do produto. Tente novamente mais tarde.');
    } finally {
      setProductLoading(false);
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Log de depuração para status
    if (name === 'status') {
      console.log('Status alterado para:', value);
      console.log('Elemento selecionado:', e.target);
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProductData({ ...productData, [name]: checked });
    } else {
      setProductData({ ...productData, [name]: value });
    }
    
    // Log após atualização
    if (name === 'status') {
      console.log('ProductData após atualização:', { ...productData, [name]: value });
    }
  };
  
  const handleRequirementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequirements({ ...requirements, [name]: value });
  };
  
  const handleVariantChange = (index: number, field: keyof Variant, value: string | number) => {
    const updatedVariants = [...variants];
    
    if (field === 'price' || field === 'stock') {
      updatedVariants[index][field] = Number(value) || 0;
    } else {
      // @ts-ignore: String assignment
      updatedVariants[index][field] = value;
    }
    
    setVariants(updatedVariants);
  };
  
  const handleFeatureChange = (variantIndex: number, featureIndex: number, value: string) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].features[featureIndex] = value;
    setVariants(updatedVariants);
  };
  
  const addFeature = (variantIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].features.push('');
    setVariants(updatedVariants);
  };
  
  const removeFeature = (variantIndex: number, featureIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].features.splice(featureIndex, 1);
    setVariants(updatedVariants);
  };
  
  const addVariant = () => {
    setVariants([...variants, {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      features: [''],
      deliveryType: 'automatic',
    }]);
  };
  
  const removeVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };
  
  // Função para obter o rótulo a partir da chave
  const getLabelFromKey = (key: string): string => {
    const labelMap: Record<string, string> = {
      'sistema_operacional': 'Sistema Operacional',
      'processador': 'Processador',
      'memoria': 'Memória',
      'placa_grafica': 'Placa de Vídeo',
      'armazenamento': 'Armazenamento',
      'notas_adicionais': 'Notas Adicionais',
    };
    
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    // Verificar se já atingiu o limite de 5 imagens
    if (images.length + files.length > 5) {
      setError('Você só pode enviar até 5 imagens.');
      return;
    }
  
    setUploading(true);
    setError('');
    
    try {
      // Criar previews locais para exibição imediata
      const newPreviews: string[] = [];
      const newImages = [...images];
      
      // Criar previews em base64 para visualização temporária
      for (const file of Array.from(files)) {
        const preview = URL.createObjectURL(file);
        newPreviews.push(preview);
        // Adicionar temporariamente às imagens com prefixo que indica que é local
        newImages.push(`temp:${preview}`);
      }
      
      // Atualizar estado com as imagens temporárias
      setImages(newImages);
      
      // Preparar o FormData para envio
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      
      // Enviar para a API de upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Remover as imagens temporárias
      const filteredImages = newImages.filter(img => !img.startsWith('temp:'));
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Reverter para o estado anterior sem as imagens temporárias
        setImages(filteredImages);
        
        throw new Error(errorData.message || 'Erro ao fazer upload das imagens');
      }
      
      const data = await response.json();
      
      // Array de caminhos de imagens retornados pela API
      const uploadedImages = data.paths;
      
      // Adicionar as URLs reais das imagens
      setImages([...filteredImages, ...uploadedImages]);
      
      // Limpar o campo de input para permitir o upload dos mesmos arquivos novamente
      if (e.target) {
        e.target.value = '';
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setError(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validação básica
    if (!productData.name || productData.name.trim() === '') {
      setError('Nome do produto é obrigatório');
      return;
    }

    // Verificar se está usando variantes ou preço único
    if (!productData.useVariants && productData.price <= 0) {
      setError('Para produtos sem variantes, o preço é obrigatório e deve ser maior que zero.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar objeto para enviar à API
      const productToSave = {
        name: productData.name,
        slug: productData.name.toLowerCase().replace(/ /g, '-'),
        shortDescription: productData.short_description,
        description: productData.description,
        category: productData.category,
        featured: productData.is_featured,
        status: productData.status,
        deliveryType: productData.deliveryType,
        // Adicionar campos específicos com base no modo (variantes ou não)
        ...(productData.useVariants 
          ? { variants: variants } 
          : { 
              price: productData.price, 
              stock: productData.deliveryType === 'manual' ? 99999 : productData.stock,
              originalPrice: productData.originalPrice > 0 ? productData.originalPrice : undefined,
              discountPercentage: productData.discountPercentage > 0 ? productData.discountPercentage : undefined
            }
        ),
        // Mapear requisitos para formato de string
        requirements: Object.entries(requirements)
          .filter(([_, value]) => value.trim() !== '')
          .map(([key, value]) => {
            const label = getLabelFromKey(key);
            return `${label}: ${value}`;
          }),
        // Imagens
        images: images,
      };
      
      // Enviar requisição de atualização
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productToSave),
        credentials: 'include' // Garante que os cookies são enviados com a requisição
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na resposta da API:', errorData);
        
        // Verificar se é um erro de autenticação
        if (response.status === 401) {
          // Redirecionar para login
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          router.push('/auth/login?redirect=/admin/products'); 
          return;
        }
        
        // Verificar se é um erro de autorização 
        if (response.status === 403) {
          toast.error('Você não tem permissão para realizar esta operação. É necessário acesso de administrador.');
          return;
        }
        
        throw new Error(errorData.message || 'Falha ao atualizar o produto');
      }
      
      // Redirecionar para a página do produto
      router.push(`/admin/products/${id}`);
      
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      setError(error.message || 'Ocorreu um erro ao atualizar o produto');
    } finally {
      setLoading(false);
    }
  };
  
  if (productLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Editar Produto</h2>
        <Link 
          href={`/admin/products/${id}`}
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Detalhes
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações básicas */}
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-white mb-4">Informações Básicas</h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={productData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="mt-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Categoria
            </label>
            <select
              id="category"
              name="category"
              value={productData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-300 mb-1">
              Descrição Curta <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={productData.short_description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Breve descrição do produto (opcional)"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Descrição Completa <span className="text-red-500">*</span>
            </label>
            <RichTextEditor 
              value={productData.description}
              onChange={(value) => setProductData({...productData, description: value})}
              placeholder="Digite a descrição completa do produto aqui..."
              minHeight={250}
            />
            <p className="mt-1 text-xs text-gray-400">
              Use as ferramentas acima para formatar o texto com negrito, itálico, listas, links e cores.
            </p>
          </div>

          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={productData.is_featured}
              onChange={handleInputChange}
              className="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-primary"
            />
            <label htmlFor="featured" className="ml-2 text-sm text-gray-300">
              Destacar este produto na página inicial
            </label>
          </div>
          
          <div className="mt-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
              Status do Cheat <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-4 mt-2 mb-4">
              <h3 className="text-white font-medium mb-2">Status do Cheat (opcional)</h3>
              <div className="flex flex-wrap gap-3">
                <div
                  onClick={() => setProductData({...productData, status: 'indetectavel'})}
                  className={`cursor-pointer rounded-md border p-3 flex items-center ${
                    productData.status === 'indetectavel' 
                      ? 'border-green-500 bg-green-900/30' 
                      : 'border-dark-300 bg-dark-300/50 hover:border-gray-400'
                  }`}
                >
                  <FiShield className={`mr-2 ${productData.status === 'indetectavel' ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className={productData.status === 'indetectavel' ? 'text-green-400' : 'text-gray-300'}>Indetectável</span>
                </div>
                
                <div
                  onClick={() => setProductData({...productData, status: 'detectavel'})}
                  className={`cursor-pointer rounded-md border p-3 flex items-center ${
                    productData.status === 'detectavel' 
                      ? 'border-yellow-500 bg-yellow-900/30' 
                      : 'border-dark-300 bg-dark-300/50 hover:border-gray-400'
                  }`}
                >
                  <FiClock className={`mr-2 ${productData.status === 'detectavel' ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className={productData.status === 'detectavel' ? 'text-yellow-400' : 'text-gray-300'}>Detectável</span>
                </div>
                
                <div
                  onClick={() => setProductData({...productData, status: 'manutencao'})}
                  className={`cursor-pointer rounded-md border p-3 flex items-center ${
                    productData.status === 'manutencao' 
                      ? 'border-red-500 bg-red-900/30' 
                      : 'border-dark-300 bg-dark-300/50 hover:border-gray-400'
                  }`}
                >
                  <FiX className={`mr-2 ${productData.status === 'manutencao' ? 'text-red-400' : 'text-gray-400'}`} />
                  <span className={productData.status === 'manutencao' ? 'text-red-400' : 'text-gray-300'}>Em Manutenção</span>
                </div>
                
                <div
                  onClick={() => setProductData({...productData, status: 'beta'})}
                  className={`cursor-pointer rounded-md border p-3 flex items-center ${
                    productData.status === 'beta' 
                      ? 'border-blue-500 bg-blue-900/30' 
                      : 'border-dark-300 bg-dark-300/50 hover:border-gray-400'
                  }`}
                >
                  <FiAward className={`mr-2 ${productData.status === 'beta' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className={productData.status === 'beta' ? 'text-blue-400' : 'text-gray-300'}>Beta</span>
                </div>
                
                <div
                  onClick={() => setProductData({...productData, status: ''})}
                  className={`cursor-pointer rounded-md border p-3 flex items-center ${
                    productData.status === '' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-dark-300 bg-dark-300/50 hover:border-gray-400'
                  }`}
                >
                  <FiSlash className={`mr-2 ${productData.status === '' ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={productData.status === '' ? 'text-primary' : 'text-gray-300'}>Sem Status</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Imagens */}
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-white mb-4">Imagens</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Imagens do Produto (até 5)</label>
            
            <div className="flex flex-wrap gap-4 mb-2">
              {images.map((image, index) => (
                <div key={index} className="relative group w-32 h-32">
                  <div className="w-full h-full bg-dark-400 rounded-md overflow-hidden">
                    {image.startsWith('temp:') ? (
                      // Imagem temporária local
                      <img 
                        src={image.replace('temp:', '')} 
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover"
                      />
                    ) : image.startsWith('data:') ? (
                      // Imagem em base64
                      <img 
                        src={image} 
                        alt={`Imagem ${index}`}
                        className="w-full h-full object-cover"
                      />
                    ) : image.startsWith('/uploads/') ? (
                      // Imagem do servidor
                      <img 
                        src={image} 
                        alt={`Imagem ${index}`}
                        className="w-full h-full object-cover"
                      />
                    ) : image.startsWith('http') ? (
                      // URL externa
                      <img 
                        src={image} 
                        alt={`Imagem ${index}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // Fallback
                      <div className="text-center text-gray-400 p-2 flex flex-col items-center justify-center w-full h-full">
                        <div className="text-xs overflow-hidden max-w-full text-ellipsis">{image}</div>
                        <div className="text-xs text-primary mt-1">Preview indisponível</div>
                      </div>
                    )}
                    
                    {/* Sobreposição que aparece ao passar o mouse */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-white hover:text-red-400 transition-colors"
                        title="Remover imagem"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-dark-400 rounded-md cursor-pointer hover:border-primary transition-colors">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  ) : (
                    <>
                      <FiUpload className="text-gray-400 mb-2" size={24} />
                      <span className="text-xs text-gray-400">Adicionar</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading || images.length >= 5}
                  />
                </label>
              )}
            </div>
            
            <p className="text-sm text-gray-400">
              {images.length}/5 imagens carregadas. Formatos suportados: JPG, PNG, WebP.
            </p>
          </div>
        </div>

        {/* Variantes/Planos */}
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Informação de Preço e Estoque</h3>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <RadioButton
                id="use-variants"
                name="useVariants"
                value="true"
                checked={productData.useVariants}
                onChange={() => setProductData({...productData, useVariants: true})}
                label="Usar variantes/planos"
              />
              <RadioButton
                id="use-single-price"
                name="useVariants"
                value="false"
                checked={!productData.useVariants}
                onChange={() => setProductData({...productData, useVariants: false})}
                label="Preço único (sem variantes/planos)"
              />
            </div>

            {/* Preço e estoque (quando não usa variantes) */}
            {!productData.useVariants && (
              <div className="mt-8 bg-dark-200 p-4 rounded-md border border-dark-400">
                <h3 className="text-lg font-medium text-white mb-4">Preço e Estoque</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      value={productData.price}
                      onChange={handleInputChange}
                      className="w-full bg-dark-300 text-white border border-dark-400 rounded-md p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Estoque
                    </label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      value={productData.stock}
                      onChange={handleInputChange}
                      className="w-full bg-dark-300 text-white border border-dark-400 rounded-md p-2"
                    />
                  </div>
                </div>

                {/* Gatilho Mental de Desconto */}
                <div className="bg-dark-200 p-6 rounded-lg shadow-md mt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Gatilho Mental de Desconto</h3>
                  <p className="text-gray-400 text-sm mb-4">Configure um desconto falso para aumentar as conversões. Estes valores serão mostrados no card do produto.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-300 mb-1">
                        Preço Original (R$)
                      </label>
                      <input
                        type="number"
                        id="originalPrice"
                        name="originalPrice"
                        value={productData.originalPrice}
                        onChange={(e) => setProductData({...productData, originalPrice: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-gray-400">Valor original que aparecerá riscado</p>
                    </div>
                    
                    <div>
                      <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-300 mb-1">
                        Desconto (%)
                      </label>
                      <input
                        type="number"
                        id="discountPercentage"
                        name="discountPercentage"
                        value={productData.discountPercentage}
                        onChange={(e) => setProductData({...productData, discountPercentage: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-gray-400">Porcentagem de desconto que será exibida</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {productData.useVariants && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Variantes/Planos</h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="bg-dark-300 hover:bg-dark-400 text-white py-1 px-3 rounded-md flex items-center text-sm"
                >
                  <FiPlus className="mr-1" size={14} />
                  Adicionar Variante
                </button>
              </div>
              
              <div className="space-y-8">
                {variants.map((variant, index) => (
                  <div key={index} className="pt-4 border-t border-dark-400 first:border-0 first:pt-0">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-white">Variante {index + 1}</h4>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-400 hover:text-red-300 flex items-center text-sm"
                        >
                          <FiTrash2 className="mr-1" size={14} />
                          Remover
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Preço (R$) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Descrição <span className="text-xs text-gray-400">(opcional)</span>
                      </label>
                      <textarea
                        value={variant.description}
                        onChange={(e) => handleVariantChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Características/Features
                        </label>
                        <button
                          type="button"
                          onClick={() => addFeature(index)}
                          className="text-primary hover:text-primary/80 flex items-center text-xs"
                        >
                          <FiPlus className="mr-1" size={12} />
                          Adicionar
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {variant.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => handleFeatureChange(index, featureIndex, e.target.value)}
                              className="flex-1 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Ex: Acesso por 30 dias"
                            />
                            <button
                              type="button"
                              onClick={() => removeFeature(index, featureIndex)}
                              className="ml-2 text-red-400 hover:text-red-300"
                              disabled={variant.features.length <= 1}
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <RadioGroup label="Tipo de Entrega da Variante">
                        <RadioButton
                          id={`variant-${index}-delivery-automatic`}
                          name={`variant-${index}-delivery-type`}
                          value="automatic"
                          checked={variant.deliveryType === 'automatic'}
                          onChange={() => {
                            const newVariants = [...variants];
                            newVariants[index].deliveryType = 'automatic';
                            setVariants(newVariants);
                          }}
                          label="Entrega Automática"
                        />
                        <RadioButton
                          id={`variant-${index}-delivery-manual`}
                          name={`variant-${index}-delivery-type`}
                          value="manual"
                          checked={variant.deliveryType === 'manual'}
                          onChange={() => {
                            const newVariants = [...variants];
                            newVariants[index].deliveryType = 'manual';
                            setVariants(newVariants);
                          }}
                          label="Entrega Manual (estoque infinito)"
                        />
                      </RadioGroup>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Requisitos do Sistema */}
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-white mb-4">Requisitos do Sistema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sistema Operacional
              </label>
              <input
                type="text"
                name="sistema_operacional"
                value={requirements.sistema_operacional}
                onChange={handleRequirementChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Windows 10 64-bit"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Processador
              </label>
              <input
                type="text"
                name="processador"
                value={requirements.processador}
                onChange={handleRequirementChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Intel Core i5 ou AMD Ryzen 5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Memória RAM
              </label>
              <input
                type="text"
                name="memoria"
                value={requirements.memoria}
                onChange={handleRequirementChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: 8 GB RAM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Placa de Vídeo
              </label>
              <input
                type="text"
                name="placa_grafica"
                value={requirements.placa_grafica}
                onChange={handleRequirementChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: NVIDIA GTX 1060 ou AMD RX 580"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Armazenamento
              </label>
              <input
                type="text"
                name="armazenamento"
                value={requirements.armazenamento}
                onChange={handleRequirementChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: 2 GB de espaço disponível"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notas Adicionais
              </label>
              <input
                type="text"
                name="notas_adicionais"
                value={requirements.notas_adicionais}
                onChange={handleRequirementChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Requer conexão com internet"
              />
            </div>
          </div>
        </div>
        
        {/* Adicione após o campo de status do produto */}
        <div className="mb-6">
          <RadioGroup label="Tipo de Entrega">
            <RadioButton
              id="delivery-automatic"
              name="delivery-type"
              value="automatic"
              checked={productData.deliveryType === 'automatic'}
              onChange={() => setProductData({...productData, deliveryType: 'automatic'})}
              label="Entrega Automática (gerencia estoque)"
            />
            <RadioButton
              id="delivery-manual"
              name="delivery-type"
              value="manual"
              checked={productData.deliveryType === 'manual'}
              onChange={() => setProductData({...productData, deliveryType: 'manual'})}
              label="Entrega Manual (estoque infinito)"
            />
          </RadioGroup>
          <p className="text-gray-400 text-xs mt-1">
            Na entrega manual, o produto terá estoque ilimitado e precisará ser entregue manualmente.
          </p>
        </div>
        
        {/* Botões de ação */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/admin/products/${id}`}
            className="px-4 py-2 bg-dark-300 text-white rounded-md hover:bg-dark-400"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 