'use client';

import React from 'react';
import { toastUtils } from '@/app/utils/toast';
import Link from 'next/link';

export default function ToastDemo() {
  const showSuccessToast = () => {
    toastUtils.success('Operação realizada com sucesso!');
  };

  const showErrorToast = () => {
    toastUtils.error('Ocorreu um erro na operação');
  };

  const showLoadingToast = () => {
    const loadingId = toastUtils.loading('Processando operação...').id;
    
    // Simular uma operação que demora 3 segundos
    setTimeout(() => {
      // 50% de chance de sucesso ou erro
      if (Math.random() > 0.5) {
        toastUtils.update(loadingId, 'Operação concluída com sucesso!', 'success');
      } else {
        toastUtils.update(loadingId, 'Erro ao processar operação', 'error');
      }
    }, 3000);
  };

  const showCustomToast = () => {
    toastUtils.custom('Esta é uma mensagem de notificação personalizada', {
      icon: '🚀',
      style: {
        background: 'rgba(24, 24, 29, 0.8)',
        borderBottom: '3px solid #8b5cf6',
      },
    });
  };

  const showAllToasts = () => {
    showSuccessToast();
    setTimeout(() => showErrorToast(), 1000);
    setTimeout(() => showCustomToast(), 2000);
    setTimeout(() => showLoadingToast(), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Demo do Sistema de Toasts</h1>
        <p className="text-gray-400">
          Esta página demonstra o novo sistema de notificações toast com design clean e posicionamento centralizado.
        </p>
        <Link href="/admin/coupons" className="mt-4 inline-block text-primary hover:underline">
          ← Voltar para cupons
        </Link>
      </header>

      <div className="bg-dark-200 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={showSuccessToast}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ✓ Sucesso
          </button>
          
          <button
            onClick={showErrorToast}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            × Erro
          </button>
          
          <button
            onClick={showLoadingToast}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ⟳ Carregamento
          </button>
          
          <button
            onClick={showCustomToast}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🚀 Personalizado
          </button>
        </div>
        
        <button
          onClick={showAllToasts}
          className="mt-6 w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Exibir Sequência de Toasts
        </button>
      </div>

      <div className="bg-dark-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Como Usar</h2>
        <div className="bg-dark-300 p-4 rounded-lg mb-4">
          <pre className="text-gray-300 text-sm overflow-x-auto">
            {`import { toastUtils } from '@/app/utils/toast';

// Toast de sucesso
toastUtils.success('Mensagem de sucesso');

// Toast de erro
toastUtils.error('Mensagem de erro');

// Toast de carregamento
const toast = toastUtils.loading('Processando...');

// Atualizar um toast existente
toastUtils.update(toast.id, 'Operação concluída!', 'success');

// Toast personalizado
toastUtils.custom('Mensagem personalizada', {
  icon: '🚀',
  style: { borderBottom: '3px solid #8b5cf6' }
});`}
          </pre>
        </div>
        <p className="text-gray-400 text-sm">
          Este novo sistema de toasts é centrando na parte inferior da tela, evitando conflitos com o botão de chat e outros elementos flutuantes.
          As animações são suaves e o design é clean, combinando com a estética do site.
        </p>
      </div>
    </div>
  );
} 