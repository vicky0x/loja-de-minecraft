'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiTag, FiBox } from 'react-icons/fi';
import Link from 'next/link';

// Interface para produtos
interface Product {
  _id: string;
  name: string;
  slug: string;
}

export default function TestCouponPage() {
  const [couponCode, setCouponCode] = useState('');
  const [cartValue, setCartValue] = useState(100);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    coupon?: {
      code: string;
      discount: number;
      discountType: string;
      discountValue: string;
    };
  } | null>(null);

  // Carregar produtos ao montar o componente
  useEffect(() => {
    fetchProducts();
  }, []);

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

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setResult({
        success: false,
        message: 'Insira um código de cupom para validar'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Preparar os itens do carrinho para simular a validação
      const cartItems = selectedProducts.map(productId => ({
        productId,
        variantId: 'default'
      }));
      
      // Simular preços individuais (dividindo o valor total igualmente entre os produtos)
      const itemPrice = selectedProducts.length > 0 ? cartValue / selectedProducts.length : cartValue;
      const itemsPrices = selectedProducts.map(() => itemPrice);

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: cartValue,
          items: cartItems,
          itemsPrices: itemsPrices
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setResult({
        success: false,
        message: 'Erro ao validar cupom. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Teste de Cupom</h1>
        <Link 
          href="/admin/coupons" 
          className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded"
        >
          Voltar para Cupons
        </Link>
      </div>

      <div className="bg-dark-200 rounded-lg shadow p-6 mb-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="cartValue" className="block text-sm font-medium text-gray-300 mb-2">
              Valor do Carrinho (R$)
            </label>
            <input
              type="number"
              id="cartValue"
              value={cartValue}
              onChange={(e) => setCartValue(Number(e.target.value))}
              className="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded text-white"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="products" className="block text-sm font-medium text-gray-300 mb-2">
              Produtos no Carrinho
            </label>
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <FiBox className="mr-2" />
              Selecione os produtos para simular o carrinho
            </div>
            <select
              id="products"
              multiple
              value={selectedProducts}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedProducts(selected);
              }}
              className="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded text-white"
              size={5}
            >
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Segure CTRL para selecionar múltiplos produtos
            </p>
          </div>

          <div>
            <label htmlFor="couponCode" className="block text-sm font-medium text-gray-300 mb-2">
              Código do Cupom
            </label>
            <div className="flex">
              <div className="relative flex-grow">
                <input 
                  type="text"
                  id="couponCode"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Insira o código do cupom"
                  className="w-full pl-10 pr-3 py-2 bg-dark-300 border border-dark-400 rounded-l text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FiTag className="text-gray-400" />
                </div>
              </div>
              <button
                onClick={validateCoupon}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-r font-medium ${
                  loading ? 'bg-gray-600' : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {loading ? 'Validando...' : 'Validar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className={`bg-dark-200 rounded-lg shadow p-6 border ${
          result.success ? 'border-green-500' : 'border-red-500'
        }`}>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            {result.success ? (
              <>
                <FiCheck className="text-green-500 mr-2" />
                Cupom Válido
              </>
            ) : (
              <>
                <FiX className="text-red-500 mr-2" />
                Cupom Inválido
              </>
            )}
          </h2>

          <p className="text-gray-300 mb-4">{result.message}</p>

          {result.success && result.coupon && (
            <div className="bg-dark-300 p-4 rounded border border-dark-400">
              <h3 className="font-medium text-white mb-2">Detalhes do Cupom</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Código:</p>
                  <p className="text-white">{result.coupon.code}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Desconto:</p>
                  <p className="text-white">
                    {result.coupon.discountType === 'percentage' 
                      ? `${result.coupon.discount}%` 
                      : `R$ ${result.coupon.discount}`}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Tipo:</p>
                  <p className="text-white">
                    {result.coupon.discountType === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Valor do Desconto:</p>
                  <p className="text-green-500 font-medium">
                    R$ {result.coupon.discountValue}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-dark-400">
                <div className="flex justify-between">
                  <span className="text-gray-300">Valor do Carrinho:</span>
                  <span className="text-white">R$ {cartValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-300">Desconto Aplicado:</span>
                  <span className="text-green-500">- R$ {result.coupon.discountValue}</span>
                </div>
                <div className="flex justify-between mt-2 font-medium">
                  <span className="text-white">Total:</span>
                  <span className="text-primary">
                    R$ {(cartValue - parseFloat(result.coupon.discountValue)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 