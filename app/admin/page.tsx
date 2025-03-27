'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  // Dados de estatísticas (mockados)
  const stats = [
    {
      title: 'Total de Vendas',
      value: 'R$ 15.890,00',
      icon: (
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      change: '+12% desde o mês passado',
      positive: true,
    },
    {
      title: 'Novos Usuários',
      value: '152',
      icon: (
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      change: '+5% desde o mês passado',
      positive: true,
    },
    {
      title: 'Produtos Vendidos',
      value: '87',
      icon: (
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      change: '-3% desde o mês passado',
      positive: false,
    },
    {
      title: 'Taxa de Conversão',
      value: '3.2%',
      icon: (
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      change: '+0.5% desde o mês passado',
      positive: true,
    },
  ];

  // Pedidos recentes (mockados)
  const recentOrders = [
    {
      id: 'ORD-001',
      user: 'João Silva',
      date: '21/03/2023',
      amount: 'R$ 289,90',
      status: 'Pago',
      statusColor: 'green',
    },
    {
      id: 'ORD-002',
      user: 'Maria Santos',
      date: '20/03/2023',
      amount: 'R$ 149,90',
      status: 'Pendente',
      statusColor: 'yellow',
    },
    {
      id: 'ORD-003',
      user: 'Carlos Oliveira',
      date: '18/03/2023',
      amount: 'R$ 399,90',
      status: 'Pago',
      statusColor: 'green',
    },
    {
      id: 'ORD-004',
      user: 'Ana Souza',
      date: '15/03/2023',
      amount: 'R$ 89,90',
      status: 'Cancelado',
      statusColor: 'red',
    },
    {
      id: 'ORD-005',
      user: 'Pedro Ferreira',
      date: '12/03/2023',
      amount: 'R$ 199,90',
      status: 'Pago',
      statusColor: 'green',
    },
  ];

  // Produtos mais vendidos (mockados)
  const topProducts = [
    {
      id: 1,
      name: 'Aimbot Pro',
      sales: 32,
      revenue: 'R$ 4.800,00',
    },
    {
      id: 2,
      name: 'ESP Vision',
      sales: 28,
      revenue: 'R$ 3.920,00',
    },
    {
      id: 3,
      name: 'Radar Hack',
      sales: 15,
      revenue: 'R$ 2.240,00',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Título da página */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div>
          <span className="text-gray-400">Hoje: </span>
          <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-dark-200 rounded-lg p-6 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className={`text-xs mt-2 flex items-center ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                  <span>
                    {stat.positive ? (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                  {stat.change}
                </p>
              </div>
              <div className="p-3 bg-dark-300 rounded-lg">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção de pedidos recentes e produtos mais vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <div className="lg:col-span-2 bg-dark-200 rounded-lg shadow-md">
          <div className="p-6 border-b border-dark-300 flex justify-between items-center">
            <h3 className="text-lg font-bold">Pedidos Recentes</h3>
            <Link href="/admin/orders" className="text-primary hover:underline text-sm">
              Ver todos
            </Link>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Usuário</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-300">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-dark-300">
                      <td className="py-3 pr-4">
                        <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                          {order.id}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">{order.user}</td>
                      <td className="py-3 pr-4">{order.date}</td>
                      <td className="py-3 pr-4">{order.amount}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium 
                            ${order.statusColor === 'green' ? 'bg-green-900/30 text-green-400' : 
                            order.statusColor === 'yellow' ? 'bg-yellow-900/30 text-yellow-400' : 
                            'bg-red-900/30 text-red-400'}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Produtos mais vendidos */}
        <div className="bg-dark-200 rounded-lg shadow-md">
          <div className="p-6 border-b border-dark-300 flex justify-between items-center">
            <h3 className="text-lg font-bold">Top Produtos</h3>
            <Link href="/admin/products" className="text-primary hover:underline text-sm">
              Ver todos
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {topProducts.map((product) => (
                <div key={product.id} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-dark-300 rounded-lg flex items-center justify-center text-primary font-bold">
                    {product.id}
                  </div>
                  <div className="flex-1">
                    <Link href={`/admin/products/${product.id}`} className="font-medium text-white hover:text-primary">
                      {product.name}
                    </Link>
                    <div className="text-gray-400 text-sm">Vendidos: {product.sales}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 