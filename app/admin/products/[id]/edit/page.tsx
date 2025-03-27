'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiTrash2, FiUpload, FiX, FiSave, FiLoader } from 'react-icons/fi';
import { use } from 'react';
import RichTextEditor from '@/app/components/RichTextEditor';

interface Variant {
  name: string;
  description: string;
  price: number;
  stock: number;
  features: string[];
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
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = use(params);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);

  // Estados para o produto
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    featured: false,
    status: 'indetectavel',
  });

  const [variants, setVariants] = useState<Variant[]>([{
    name: '',
    description: '',
    price: 0,
    stock: 0,
    features: [''],
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
      const product = data.product;
      
      // Preencher os dados do formulário
      setProductData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        category: product.category?._id || '',
        featured: product.featured || false,
        status: product.status || 'indetectavel',
      });
      
      // Configurar variantes
      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants);
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
      
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      setError('Não foi possível carregar os dados do produto. Tente novamente mais tarde.');
    } finally {
      setProductLoading(false);
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProductData({ ...productData, [name]: checked });
    } else {
      setProductData({ ...productData, [name]: value });
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
    }]);
  };
  
  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
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
  
    // Validações básicas
    if (!productData.name || !productData.description) {
      setError('Nome e descrição são obrigatórios.');
      return;
    }
  
    if (variants.length === 0) {
      setError('Ao menos uma variante é obrigatória.');
      return;
    }
  
    if (images.length === 0) {
      setError('Ao menos uma imagem é obrigatória.');
      return;
    }
  
    try {
      setLoading(true);
      
      // Preparar requisitos como array de strings
      const requirementsArray = Object.entries(requirements)
        .filter(([_, value]) => value.trim() !== '')
        .map(([key, value]) => `${key}: ${value}`);
      
      // Preparar FormData para envio
      const formData = new FormData();
      
      // Adicionar dados básicos
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('shortDescription', productData.shortDescription);
      if (productData.category) {
        formData.append('category', productData.category);
      }
      formData.append('featured', productData.featured.toString());
      formData.append('status', productData.status);
      
      // Adicionar variantes
      formData.append('variants', JSON.stringify(variants));
      
      // Adicionar imagens existentes
      images.forEach(image => {
        formData.append('keepImages[]', image);
      });
      
      // Adicionar requisitos
      requirementsArray.forEach((req, index) => {
        formData.append(`requirements[${index}]`, req);
      });
      
      // Enviar para a API
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        body: formData,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Redirecionar para a página de detalhes do produto
        router.push(`/admin/products/${id}`);
      } else {
        setError(data.message || 'Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      setError('Ocorreu um erro ao atualizar o produto. Tente novamente.');
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
              value={productData.shortDescription}
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
              checked={productData.featured}
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
            <select
              id="status"
              name="status"
              value={productData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="indetectavel">Indetectável</option>
              <option value="detectavel">Detectável</option>
              <option value="manutencao">Em Manutenção</option>
              <option value="beta">Beta</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Status atual do cheat que será exibido aos clientes
            </p>
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

        {/* Variantes */}
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
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
              </div>
            ))}
          </div>
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