'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlus, FiX, FiUpload, FiTrash, FiSave, FiArrowLeft, FiShield, FiClock, FiAward, FiSlash } from 'react-icons/fi';
import RichTextEditor from '@/app/components/RichTextEditor';
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

export default function NewProductPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);

  // Estados para o produto
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    short_description: '',
    category: '',
    is_featured: false,
    status: 'indetectavel',
    useVariants: true,
    price: 0,
    stock: 0,
    originalPrice: 0,
    discountPercentage: 0,
    deliveryType: 'automatic',
  });

  const [variants, setVariants] = useState<Variant[]>([{
    name: '',
    description: '',
    price: 0,
    stock: 0,
    features: [''],
    deliveryType: 'automatic',
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

  // Função auxiliar para formatar nomes que estão em formato de slug
  const formatSlugToName = (text: string): string => {
    if (!text) return '';
    
    return text
      .replace(/-/g, ' ') // substituir hífens por espaços
      .replace(/\b\w/g, l => l.toUpperCase()) // capitalizar primeira letra de cada palavra
      .replace(/\s+\(copia\)/gi, ' (Cópia)') // formatar "copia" para "Cópia" com espaço antes
      .replace(/\s+copia\s+\d+/gi, (match) => { // formatar "copia 1234" para "Cópia 1234"
        return match.replace(/copia/i, 'Cópia');
      });
  };

  useEffect(() => {
    // Carregar categorias ao montar o componente
    fetchCategories();

    // Verificar se há um nome predefinido na URL e formatá-lo adequadamente
    const urlParams = new URLSearchParams(window.location.search);
    const presetName = urlParams.get('name');
    
    if (presetName) {
      // Converter formato de slug para texto normal
      const formattedName = formatSlugToName(presetName);
      
      setProductData(prev => ({
        ...prev,
        name: formattedName
      }));
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProductData({
        ...productData,
        [name]: checked,
      });
    } else {
      // Para o campo de nome, garantir que não está em formato de slug
      if (name === 'name') {
        const formattedValue = formatSlugToName(value);
        setProductData({
          ...productData,
          [name]: formattedValue,
        });
      } else {
        setProductData({
          ...productData,
          [name]: value,
        });
      }
    }
  };

  const handleRequirementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequirements({
      ...requirements,
      [name]: value,
    });
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: string | number) => {
    const updatedVariants = [...variants];
    if (field === 'price' || field === 'stock') {
      updatedVariants[index][field] = Number(value);
    } else if (field === 'features') {
      console.warn('Use handleVariantFeatureChange para atualizar features');
    } else {
      updatedVariants[index][field] = value as string;
    }
    setVariants(updatedVariants);
  };

  const handleVariantFeatureChange = (variantIndex: number, featureIndex: number, value: string) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].features[featureIndex] = value;
    setVariants(updatedVariants);
  };

  const addVariantFeature = (variantIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].features.push('');
    setVariants(updatedVariants);
  };

  const removeVariantFeature = (variantIndex: number, featureIndex: number) => {
    if (variants[variantIndex].features.length <= 1) return;
    
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
    if (variants.length <= 1) return;
    
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    // Se estiver usando previewImages também, deve limpar também
    if (previewImages) {
      const newPreviews = [...previewImages];
      newPreviews.splice(index, 1);
      setPreviewImages(newPreviews);
    }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (!productData.name || !productData.description) {
      setError('Nome e descrição são obrigatórios.');
      return;
    }

    // Verificar se está usando variantes ou preço único
    if (!productData.useVariants && productData.price <= 0) {
      setError('Para produtos sem variantes, o preço é obrigatório e deve ser maior que zero.');
      return;
    }

    try {
      setLoading(true);
      
      // Preparar requisitos como array de strings
      const requirementsArray = Object.entries(requirements)
        .filter(([_, value]) => value.trim() !== '')
        .map(([key, value]) => `${key}: ${value}`);
      
      // Preparar objeto para enviar à API
      const productToSave = {
        name: productData.name.trim(),
        slug: productData.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        shortDescription: productData.short_description,
        description: productData.description,
        category: productData.category,
        featured: productData.is_featured,
        status: productData.status || undefined,
        deliveryType: productData.deliveryType,
        ...(productData.useVariants 
          ? { variants: variants } 
          : { 
              price: productData.price, 
              stock: productData.deliveryType === 'manual' ? 99999 : productData.stock,
              originalPrice: productData.originalPrice > 0 ? productData.originalPrice : undefined,
              discountPercentage: productData.discountPercentage > 0 ? productData.discountPercentage : undefined
            }
        ),
        images,
        requirements: requirementsArray,
      };

      // Remover categoria se não estiver selecionada
      if (!productToSave.category) {
        delete productToSave.category;
      }
      
      // Remover status se estiver vazio
      if (productData.status === '') {
        delete productToSave.status;
      }

      // Excluir a propriedade useVariants pois é apenas para controle na UI
      delete productToSave.useVariants;

      // Enviar para a API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productToSave),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirecionar para a lista de produtos
        router.push('/admin/products');
      } else {
        setError(data.message || 'Erro ao criar produto');
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      setError('Ocorreu um erro ao criar o produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Novo Produto</h2>
        <Link 
          href="/admin/products" 
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Produtos
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={productData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
                aria-label="Nome do produto"
              />
            </div>
            
            <div>
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
                {categoryLoading ? (
                  <option disabled>Carregando categorias...</option>
                ) : (
                  categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="short_description" className="block text-sm font-medium text-gray-300 mb-1">
              Descrição Curta <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              id="short_description"
              name="short_description"
              value={productData.short_description || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Breve descrição do produto (opcional)"
              aria-label="Descrição curta do produto"
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
              id="is_featured"
              name="is_featured"
              checked={productData.is_featured}
              onChange={handleInputChange}
              className="w-4 h-4 bg-dark-300 border-dark-400 rounded focus:ring-primary"
            />
            <label htmlFor="is_featured" className="ml-2 text-sm text-gray-300">
              Destacar este produto na página inicial
            </label>
          </div>
          
          <div className="mb-4">
            <label htmlFor="status" className="block text-white font-medium mb-2">
              Status do Cheat (opcional)
            </label>
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
            <p className="mt-2 text-xs text-gray-400">
              Status do cheat que será exibido aos clientes
            </p>
          </div>

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
                        <FiTrash size={20} />
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

            {!productData.useVariants && (
              <div className="border border-dark-400 rounded-lg p-4">
                <h4 className="font-bold text-white mb-4">Preço e Estoque</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      value={productData.price}
                      onChange={(e) => setProductData({...productData, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Estoque Disponível
                    </label>
                    <input
                      type="number"
                      value={productData.stock}
                      onChange={(e) => setProductData({...productData, stock: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {productData.useVariants && (
            <>
              <h3 className="text-xl font-semibold text-white mb-4">Variantes/Planos</h3>
              
              {variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="bg-dark-300 p-4 rounded-lg mb-4 border border-dark-400">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-white">Plano #{variantIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeVariant(variantIndex)}
                      className="p-1 text-red-400 hover:text-red-300"
                      title="Remover plano"
                      disabled={variants.length <= 1}
                    >
                      <FiTrash size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Nome do Plano *
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(variantIndex, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ex: Básico, Premium, etc."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Preço (R$) *
                      </label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(variantIndex, 'price', e.target.value)}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Estoque Disponível
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(variantIndex, 'stock', e.target.value)}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Descrição do Plano <span className="text-xs text-gray-400">(opcional)</span>
                      </label>
                      <textarea
                        value={variant.description}
                        onChange={(e) => handleVariantChange(variantIndex, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Descreva os benefícios deste plano (opcional)"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <RadioGroup label="Tipo de Entrega da Variante">
                      <RadioButton
                        id={`variant-${variantIndex}-delivery-automatic`}
                        name={`variant-${variantIndex}-delivery-type`}
                        value="automatic"
                        checked={variant.deliveryType === 'automatic'}
                        onChange={() => {
                          const newVariants = [...variants];
                          newVariants[variantIndex].deliveryType = 'automatic';
                          setVariants(newVariants);
                        }}
                        label="Entrega Automática"
                      />
                      <RadioButton
                        id={`variant-${variantIndex}-delivery-manual`}
                        name={`variant-${variantIndex}-delivery-type`}
                        value="manual"
                        checked={variant.deliveryType === 'manual'}
                        onChange={() => {
                          const newVariants = [...variants];
                          newVariants[variantIndex].deliveryType = 'manual';
                          setVariants(newVariants);
                        }}
                        label="Entrega Manual (estoque infinito)"
                      />
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Características do Plano
                    </label>
                    
                    {variant.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleVariantFeatureChange(variantIndex, featureIndex, e.target.value)}
                          className="flex-1 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Ex: Acesso por 30 dias"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantFeature(variantIndex, featureIndex)}
                          className="p-2 text-red-400 hover:text-red-300"
                          title="Remover característica"
                          disabled={variant.features.length <= 1}
                        >
                          <FiX size={20} />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addVariantFeature(variantIndex)}
                      className="mt-2 flex items-center text-primary hover:text-primary/80"
                    >
                      <FiPlus size={16} className="mr-1" />
                      <span>Adicionar característica</span>
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addVariant}
                className="mt-2 flex items-center text-primary hover:text-primary/80"
              >
                <FiPlus size={16} className="mr-1" />
                <span>Adicionar Plano</span>
              </button>
            </>
          )}
        </div>

        {/* Requisitos do Sistema */}
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-white mb-4">Requisitos do Sistema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sistema_operacional" className="block text-sm font-medium text-gray-300 mb-1">
                Sistema Operacional
              </label>
              <input
                type="text"
                id="sistema_operacional"
                name="sistema_operacional"
                value={requirements.sistema_operacional || ''}
                onChange={handleRequirementChange}
                placeholder="Ex: Windows 10 64-bit"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label htmlFor="processador" className="block text-sm font-medium text-gray-300 mb-1">
                Processador
              </label>
              <input
                type="text"
                id="processador"
                name="processador"
                value={requirements.processador || ''}
                onChange={handleRequirementChange}
                placeholder="Ex: Intel Core i5 ou equivalente"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label htmlFor="memoria" className="block text-sm font-medium text-gray-300 mb-1">
                Memória
              </label>
              <input
                type="text"
                id="memoria"
                name="memoria"
                value={requirements.memoria || ''}
                onChange={handleRequirementChange}
                placeholder="Ex: 8 GB RAM"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label htmlFor="placa_grafica" className="block text-sm font-medium text-gray-300 mb-1">
                Placa de Vídeo
              </label>
              <input
                type="text"
                id="placa_grafica"
                name="placa_grafica"
                value={requirements.placa_grafica || ''}
                onChange={handleRequirementChange}
                placeholder="Ex: NVIDIA GTX 1060 ou superior"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label htmlFor="armazenamento" className="block text-sm font-medium text-gray-300 mb-1">
                Armazenamento
              </label>
              <input
                type="text"
                id="armazenamento"
                name="armazenamento"
                value={requirements.armazenamento || ''}
                onChange={handleRequirementChange}
                placeholder="Ex: 50 GB de espaço disponível"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notas_adicionais" className="block text-sm font-medium text-gray-300 mb-1">
                Notas Adicionais
              </label>
              <textarea
                id="notas_adicionais"
                name="notas_adicionais"
                value={requirements.notas_adicionais}
                onChange={handleRequirementChange}
                rows={3}
                placeholder="Quaisquer outras informações ou requisitos relevantes"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Botão de envio */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-md flex items-center ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                Salvando...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Salvar Produto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 