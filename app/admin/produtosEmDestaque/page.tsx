'use client';

import React from 'react';
import { FiChevronLeft } from 'react-icons/fi';
import Link from 'next/link';
import ProductFeaturedSelector from '../components/ProductFeaturedSelector';

export default function ProductsFeaturedPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Produtos em Destaque</h2>
        <Link 
          href="/admin" 
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiChevronLeft className="mr-2" />
          Voltar ao Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-white mb-4">Gerenciar Destaques da Página Principal</h3>
          <p className="text-gray-400 mb-4">
            Selecione os produtos que deseja exibir na seção de destaque da página principal. Os produtos selecionados serão exibidos na ordem que foram selecionados.
          </p>
          <p className="text-gray-400 mb-4">
            Você pode selecionar até 4 produtos para exibir na seção de destaque. Se nenhum produto for selecionado, o sistema mostrará automaticamente produtos marcados como "Destaque" no cadastro.
          </p>
        </div>

        <ProductFeaturedSelector />
      </div>
    </div>
  );
} 