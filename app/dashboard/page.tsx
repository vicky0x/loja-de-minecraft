'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiDownload, FiCreditCard, FiShoppingBag, FiHelpCircle } from 'react-icons/fi';

export default function Dashboard() {
  const [stats, setStats] = useState({
    purchases: 0,
    downloads: 0,
    activeSubscriptions: 0,
    tickets: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    // Simulação de dados - em produção, buscar do backend
    setTimeout(() => {
      setStats({
        purchases: 5,
        downloads: 12,
        activeSubscriptions: 1,
        tickets: 0
      });
      
      setLatestProducts([
        { id: 1, name: 'Fortnite Premium Hack', status: 'Ativo', lastUpdate: '2023-03-25' },
        { id: 2, name: 'CS2 Aimbot Pro', status: 'Ativo', lastUpdate: '2023-03-20' },
        { id: 3, name: 'Valorant ESP Hack', status: 'Atualização pendente', lastUpdate: '2023-03-15' }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
    <div className="bg-dark-200 rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} text-white mr-4`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{value}</h3>
          <p className="text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Bem-vindo à sua Área de Cliente</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Compras"
          value={stats.purchases}
          icon={<FiShoppingBag className="h-6 w-6" />}
          color="bg-primary"
        />
        <StatCard
          title="Downloads"
          value={stats.downloads}
          icon={<FiDownload className="h-6 w-6" />}
          color="bg-primary"
        />
        <StatCard
          title="Assinaturas Ativas"
          value={stats.activeSubscriptions}
          icon={<FiCreditCard className="h-6 w-6" />}
          color="bg-primary"
        />
        <StatCard
          title="Tickets de Suporte"
          value={stats.tickets}
          icon={<FiHelpCircle className="h-6 w-6" />}
          color="bg-primary"
        />
      </div>
      
      <div className="bg-dark-200 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-white">Meus Produtos</h3>
        
        {latestProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-400">
              <thead className="bg-dark-300">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Produto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Última atualização
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-300 divide-y divide-dark-400">
                {latestProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-dark-400">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'Ativo' 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(product.lastUpdate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/dashboard/downloads?product=${product.id}`} className="text-primary hover:text-primary/80">
                        Download
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-dark-300 rounded-md text-center">
            <p className="text-gray-400">Você ainda não possui produtos.</p>
            <Link href="/products" className="inline-block mt-2 text-primary hover:text-primary/80">
              Explorar produtos
            </Link>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Links Rápidos</h3>
          <div className="space-y-3">
            <Link href="/dashboard/downloads" className="flex items-center text-gray-300 hover:text-primary">
              <FiDownload className="h-5 w-5 mr-2" />
              <span>Acessar meus downloads</span>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center text-gray-300 hover:text-primary">
              <FiShoppingBag className="h-5 w-5 mr-2" />
              <span>Atualizar perfil</span>
            </Link>
            <Link href="/dashboard/support" className="flex items-center text-gray-300 hover:text-primary">
              <FiHelpCircle className="h-5 w-5 mr-2" />
              <span>Suporte técnico</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Avisos</h3>
          <div className="p-4 bg-dark-300 border border-primary/20 text-gray-300 rounded-md">
            <p className="font-medium text-primary">Bem-vindo ao Fantasy Cheats!</p>
            <p className="mt-1 text-sm text-gray-300">
              Obrigado por se juntar a nós. Descubra os melhores cheats para seus jogos favoritos.
              Se precisar de ajuda, nossa equipe de suporte está disponível 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 