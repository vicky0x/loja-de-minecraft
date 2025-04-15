'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiAlertCircle, FiCalendar, FiPercent, FiTag, FiUsers, FiGift, FiBox, FiShoppingBag, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/app/lib/auth/session';
import RadioButton, { RadioGroup } from '@/app/components/ui/RadioButton';

// Interface para produtos
interface Product {
  _id: string;
  name: string;
  slug: string;
}

// Interface para o cupom
interface Coupon {
  _id: string;
  code: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  maxUses: number;
  usedCount: number;
  minAmount: number;
  maxAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: string[] | {_id: string, name: string, slug: string}[];
  categories: string[] | {_id: string, name: string, slug: string}[];
  createdAt: string;
  updatedAt: string;
}

export default function EditCouponPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [couponId, setCouponId] = useState<string>('');
  const [couponData, setCouponData] = useState({
    code: '',
    description: '',
    discount: 10,
    discountType: 'percentage',
    maxUses: 0,
    minAmount: 0,
    maxAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    isActive: true,
    productRestriction: 'all', // 'all' ou 'specific'
    products: [] as string[]
  });
  
  // Extrair ID do pathname
  useEffect(() => {
    // O pathname deve ser algo como '/admin/coupons/12345'
    const segments = pathname.split('/');
    const id = segments[segments.length - 1];
    
    if (id) {
      setCouponId(id);
      fetchCouponData(id);
      fetchProducts();
    }
  }, [pathname]);

  // Função para buscar os dados do cupom
  const fetchCouponData = async (id: string) => {
    try {
      setPageLoading(true);
      setError('');
      
      const response = await fetch(`/api/coupons/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar dados do cupom');
      }
      
      const coupon = data.coupon;
      
      // Formatar datas para o formato YYYY-MM-DD
      const formattedStartDate = coupon.startDate.split('T')[0];
      const formattedEndDate = coupon.endDate.split('T')[0];
      
      // Preparar os produtos para o formato correto
      const productIds = Array.isArray(coupon.products) 
        ? coupon.products.map((p: any) => typeof p === 'string' ? p : p._id)
        : [];
      
      setCouponData({
        code: coupon.code,
        description: coupon.description || '',
        discount: coupon.discount,
        discountType: coupon.discountType,
        maxUses: coupon.maxUses,
        minAmount: coupon.minAmount,
        maxAmount: coupon.maxAmount,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        isActive: coupon.isActive,
        productRestriction: productIds.length > 0 ? 'specific' : 'all',
        products: productIds
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados do cupom');
      console.error('Erro ao buscar dados do cupom:', err);
    } finally {
      setPageLoading(false);
    }
  };

  // Função para buscar produtos
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setCouponData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'number') {
      setCouponData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value),
      }));
    } else {
      setCouponData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!couponId) {
      setError('ID do cupom não encontrado. Por favor, recarregue a página.');
      return;
    }
    
    // Validações básicas
    if (!couponData.code.trim()) {
      setError('O código do cupom é obrigatório');
      return;
    }
    
    if (isNaN(Number(couponData.discount)) || Number(couponData.discount) <= 0) {
      setError('O valor do desconto deve ser maior que zero');
      return;
    }
    
    if (couponData.discountType === 'percentage' && Number(couponData.discount) > 100) {
      setError('O valor do desconto percentual não pode ser maior que 100%');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
        credentials: 'include', // Garante que os cookies sejam enviados com a requisição
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        setSuccess('Cupom atualizado com sucesso');
        setTimeout(() => {
          router.push('/admin/coupons');
        }, 2000);
      } else {
        if (response.status === 401) {
          setError('Você não está autenticado. Por favor, faça login novamente.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else if (response.status === 403) {
          setError('Você não tem permissão para editar cupons.');
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        } else {
          setError(responseData.message || 'Erro ao atualizar cupom');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      setError('Erro ao atualizar cupom. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FiLoader className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-400">Carregando dados do cupom...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Editar Cupom</h2>
        <Link 
          href="/admin/coupons" 
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Cupons
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
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      <div className="bg-dark-200 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Código do Cupom */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="text-gray-400" />
                </div>
                <input 
                  type="text"
                  id="code"
                  name="code"
                  value={couponData.code}
                  onChange={handleChange}
                  placeholder="Ex: DESCONTO20"
                  className="w-full pl-10 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                O código será convertido para maiúsculas automaticamente
              </p>
            </div>
            
            {/* Tipo de Desconto */}
            <div>
              <label htmlFor="discountType" className="block text-sm font-medium text-gray-300 mb-1">
                Tipo de Desconto <span className="text-red-500">*</span>
              </label>
              <select
                id="discountType"
                name="discountType"
                value={couponData.discountType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            
            {/* Valor do Desconto */}
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-300 mb-1">
                Desconto <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPercent className="text-gray-400" />
                </div>
                <input 
                  type="number"
                  id="discount"
                  name="discount"
                  value={couponData.discount}
                  onChange={handleChange}
                  min={1}
                  max={couponData.discountType === 'percentage' ? 100 : undefined}
                  step={couponData.discountType === 'percentage' ? 1 : 0.01}
                  className="w-full pl-10 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {couponData.discountType === 'percentage' 
                  ? 'Valor em porcentagem (máximo 100%)' 
                  : 'Valor em reais (R$)'}
              </p>
            </div>
            
            {/* Número Máximo de Usos */}
            <div>
              <label htmlFor="maxUses" className="block text-sm font-medium text-gray-300 mb-1">
                Número Máximo de Usos
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUsers className="text-gray-400" />
                </div>
                <input 
                  type="number"
                  id="maxUses"
                  name="maxUses"
                  value={couponData.maxUses}
                  onChange={handleChange}
                  min={0}
                  className="w-full pl-10 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                0 = uso ilimitado
              </p>
            </div>
            
            {/* Data de Início */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                Data de Início <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input 
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={couponData.startDate}
                  onChange={handleChange}
                  className="w-full pl-10 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
            
            {/* Data de Término */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                Data de Término <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input 
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={couponData.endDate}
                  onChange={handleChange}
                  min={couponData.startDate}
                  className="w-full pl-10 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
            
            {/* Valor Mínimo de Compra */}
            <div>
              <label htmlFor="minAmount" className="block text-sm font-medium text-gray-300 mb-1">
                Valor Mínimo (R$)
              </label>
              <input 
                type="number"
                id="minAmount"
                name="minAmount"
                value={couponData.minAmount}
                onChange={handleChange}
                min={0}
                step={0.01}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-gray-400">
                0 = sem valor mínimo de compra
              </p>
            </div>
            
            {/* Valor Máximo de Desconto */}
            <div>
              <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-300 mb-1">
                Valor Máximo de Desconto (R$)
              </label>
              <input 
                type="number"
                id="maxAmount"
                name="maxAmount"
                value={couponData.maxAmount}
                onChange={handleChange}
                min={0}
                step={0.01}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-gray-400">
                0 = sem limite máximo de desconto
              </p>
            </div>
          </div>
          
          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Descrição
            </label>
            <textarea 
              id="description"
              name="description"
              value={couponData.description}
              onChange={handleChange}
              placeholder="Descrição do cupom (opcional)"
              rows={3}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          
          {/* Status do Cupom */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={couponData.isActive}
              onChange={(e) => setCouponData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-primary focus:ring-primary border-dark-400 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
              Cupom ativo
            </label>
          </div>
          
          {/* Restrição de Produto */}
          <div>
            <RadioGroup label="Aplicar cupom a:" className="space-y-2">
              <RadioButton
                id="allProducts"
                name="productRestriction"
                value="all"
                checked={couponData.productRestriction === 'all'}
                onChange={() => setCouponData(prev => ({ ...prev, productRestriction: 'all', products: [] }))}
                label={
                  <span className="flex items-center">
                    <FiShoppingBag className="mr-2" />
                    Todos os produtos
                  </span>
                }
              />
              <RadioButton
                id="specificProducts"
                name="productRestriction"
                value="specific"
                checked={couponData.productRestriction === 'specific'}
                onChange={() => setCouponData(prev => ({ ...prev, productRestriction: 'specific' }))}
                label={
                  <span className="flex items-center">
                    <FiBox className="mr-2" />
                    Produtos específicos
                  </span>
                }
              />
            </RadioGroup>
          </div>
          
          {/* Seleção de Produtos Específicos */}
          {couponData.productRestriction === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selecione os produtos
              </label>
              <div className="max-h-60 overflow-y-auto border border-dark-400 rounded-md p-2 bg-dark-300">
                {products.length === 0 ? (
                  <p className="text-gray-400 text-sm p-2">Carregando produtos...</p>
                ) : (
                  <div className="space-y-2">
                    {products.map(product => (
                      <div key={product._id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`product-${product._id}`}
                          checked={couponData.products.includes(product._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCouponData(prev => ({
                                ...prev,
                                products: [...prev.products, product._id]
                              }));
                            } else {
                              setCouponData(prev => ({
                                ...prev,
                                products: prev.products.filter(id => id !== product._id)
                              }));
                            }
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-dark-400 rounded"
                        />
                        <label htmlFor={`product-${product._id}`} className="ml-2 block text-sm text-gray-300">
                          {product.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {couponData.productRestriction === 'specific' && couponData.products.length === 0 && (
                <p className="mt-2 text-xs text-amber-400">
                  Selecione pelo menos um produto para aplicar o cupom especificamente.
                </p>
              )}
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="flex justify-end pt-4">
            <Link
              href="/admin/coupons"
              className="px-4 py-2 rounded-md bg-dark-300 text-gray-300 hover:bg-dark-400 hover:text-white transition-colors mr-2"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center disabled:opacity-70"
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
    </div>
  );
} 