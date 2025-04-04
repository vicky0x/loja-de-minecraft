import React from 'react';
import { FiPackage, FiClock, FiDollarSign } from 'react-icons/fi';

// Props do componente
interface DashboardStatsProps {
  stats: {
    totalProducts: number;
    pendingOrders: number;
    revenue: number;
  };
  isLoading: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  isLoading = false
}) => {
  // Formatação de valores monetários
  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(n => (
          <div key={n} className="bg-dark-200/50 rounded-lg p-4 h-24"></div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Produtos Comprados',
      value: stats.totalProducts || 0,
      icon: <FiPackage className="w-6 h-6 text-blue-500" />,
      bgColor: 'bg-blue-900/30',
      textColor: 'text-blue-400'
    },
    {
      title: 'Pedidos Feitos',
      value: stats.pendingOrders || 0,
      icon: <FiClock className="w-6 h-6 text-amber-500" />,
      bgColor: 'bg-amber-900/30',
      textColor: 'text-amber-400'
    },
    {
      title: 'Valor Total Gasto',
      value: formatCurrency(stats.revenue || 0),
      icon: <FiDollarSign className="w-6 h-6 text-green-500" />,
      bgColor: 'bg-green-900/30',
      textColor: 'text-green-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((card, index) => (
        <div 
          key={index} 
          className={`${card.bgColor} border border-dark-400 rounded-lg p-4 shadow-sm`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">{card.title}</p>
              <h3 className={`text-xl font-bold mt-1 ${card.textColor}`}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-dark-300">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats; 