import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  // Jogos populares
  const popularGames = [
    {
      id: 1,
      name: 'Valorant',
      image: '/images/games/valorant.jpg',
      slug: 'valorant',
    },
    {
      id: 2,
      name: 'Counter-Strike 2',
      image: '/images/games/cs2.jpg',
      slug: 'cs2',
    },
    {
      id: 3,
      name: 'Apex Legends',
      image: '/images/games/apex.jpg',
      slug: 'apex-legends',
    },
    {
      id: 4,
      name: 'PUBG',
      image: '/images/games/pubg.jpg',
      slug: 'pubg',
    },
    {
      id: 5,
      name: 'Fortnite',
      image: '/images/games/fortnite.jpg',
      slug: 'fortnite',
    },
    {
      id: 6,
      name: 'Call of Duty',
      image: '/images/games/cod.jpg',
      slug: 'call-of-duty',
    }
  ];

  // Features do produto
  const features = [
    {
      icon: 'shield',
      title: 'Anti-Ban',
      description: 'Nossa tecnologia avançada de bypass mantém sua conta segura e evita banimentos'
    },
    {
      icon: 'update',
      title: 'Atualizações Constantes',
      description: 'Atualizamos nossos cheats regularmente para acompanhar as mudanças nos jogos'
    },
    {
      icon: 'support',
      title: 'Suporte 24/7',
      description: 'Nossa equipe de suporte está sempre disponível para ajudar com qualquer problema'
    },
    {
      icon: 'interface',
      title: 'Interface Intuitiva',
      description: 'Fácil de usar com configurações personalizáveis para personalizar sua experiência'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-dark-100 overflow-hidden">
        {/* Background com efeito */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-100/90 via-dark-100/80 to-dark-100"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
        </div>
        
        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-yellow-500">
              FANTASY CHEATS
            </h1>
            <h2 className="text-5xl font-bold mb-6">
              A MELHOR EXPERIÊNCIA EM <span className="text-primary">CHEATS</span> PARA JOGOS
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Aumente seu desempenho nos jogos com nossos cheats premium desenvolvidos com tecnologia avançada e proteção anti-ban.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Link 
                href="/products" 
                className="btn btn-primary text-center text-lg px-10 py-4 rounded-lg font-medium"
              >
                VER PRODUTOS
              </Link>
              <Link 
                href="/auth/register" 
                className="btn btn-outline text-center text-lg px-10 py-4 rounded-lg font-medium"
              >
                CRIAR CONTA
              </Link>
            </div>
            
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="p-6 bg-dark-200 rounded-xl">
                <div className="text-4xl font-bold text-primary mb-2">98%</div>
                <div className="text-gray-300">Taxa de Satisfação</div>
              </div>
              <div className="p-6 bg-dark-200 rounded-xl">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-gray-300">Suporte Técnico</div>
              </div>
              <div className="p-6 bg-dark-200 rounded-xl">
                <div className="text-4xl font-bold text-primary mb-2">10k+</div>
                <div className="text-gray-300">Usuários Ativos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jogos Disponíveis */}
      <section className="py-20 bg-dark-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">JOGOS DISPONÍVEIS</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Oferecemos cheats para os jogos mais populares do mercado
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {popularGames.map((game) => (
              <Link key={game.id} href={`/products/games/${game.slug}`}>
                <div className="bg-dark-300 rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                  <div className="h-36 bg-dark-400 relative flex items-center justify-center">
                    {/* Substituir por imagem real quando tiver */}
                    <span className="text-lg font-bold text-center px-4">{game.name}</span>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-medium">{game.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/products" 
              className="btn btn-outline px-8 py-3 rounded-lg"
            >
              VER TODOS OS JOGOS
            </Link>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">NOSSOS DIFERENCIAIS</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Por que escolher a Fantasy Cheats para suas vantagens competitivas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-dark-200 rounded-xl transition-all hover:bg-dark-300">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 mx-auto">
                  <span className="text-primary text-2xl">
                    {feature.icon === 'shield' && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    {feature.icon === 'update' && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {feature.icon === 'support' && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    )}
                    {feature.icon === 'interface' && (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-400 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-dark-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">O QUE DIZEM NOSSOS CLIENTES</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Veja o que nossa comunidade tem a dizer sobre a Fantasy Cheats
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-300 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "Melhor cheat que já usei! Estou usando há mais de 6 meses e nunca tive problemas com banimento. O suporte é excelente e respondem muito rápido."
              </p>
              <div className="font-medium">Carlos S.</div>
              <div className="text-sm text-gray-400">Cliente há 8 meses</div>
            </div>
            
            <div className="bg-dark-300 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "A interface é super intuitiva e as funcionalidades são incríveis. Meu K/D melhorou significativamente desde que comecei a usar!"
              </p>
              <div className="font-medium">Amanda F.</div>
              <div className="text-sm text-gray-400">Cliente há 3 meses</div>
            </div>
            
            <div className="bg-dark-300 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "Tentei vários outros cheats antes, mas a Fantasy Cheats está em outro nível. As atualizações são rápidas e o anti-ban realmente funciona!"
              </p>
              <div className="font-medium">Rodrigo M.</div>
              <div className="text-sm text-gray-400">Cliente há 5 meses</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">PERGUNTAS FREQUENTES</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Respostas para as dúvidas mais comuns sobre nossos produtos
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="bg-dark-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">É seguro usar os cheats da Fantasy Cheats?</h3>
                <p className="text-gray-300">
                  Sim, todos os nossos cheats são desenvolvidos com tecnologia anti-detecção avançada. Mesmo assim, recomendamos sempre seguir nossas diretrizes de uso para maior segurança.
                </p>
              </div>
              
              <div className="bg-dark-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Quanto tempo leva para receber acesso após a compra?</h3>
                <p className="text-gray-300">
                  O acesso é instantâneo após a confirmação do pagamento. Você receberá um email com instruções de como acessar sua área do cliente.
                </p>
              </div>
              
              <div className="bg-dark-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Os cheats funcionam em qualquer computador?</h3>
                <p className="text-gray-300">
                  Nossos cheats são otimizados para funcionarem na maioria dos computadores. Os requisitos mínimos estão detalhados na página de cada produto.
                </p>
              </div>
              
              <div className="bg-dark-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">O que acontece se eu for banido usando o cheat?</h3>
                <p className="text-gray-300">
                  Oferecemos garantia anti-ban para a maioria dos nossos produtos. Caso ocorra um banimento enquanto estiver usando nosso software corretamente, entre em contato com nosso suporte.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Link 
                href="/faq" 
                className="text-primary hover:underline"
              >
                Ver todas as perguntas frequentes →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary/90 to-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            PRONTO PARA ELEVAR SEU JOGO AO PRÓXIMO NÍVEL?
          </h2>
          <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de jogadores que já confiam nos nossos cheats para obter vantagem competitiva.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className="btn bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3 rounded-lg"
            >
              EXPLORAR PRODUTOS
            </Link>
            <Link 
              href="/auth/register" 
              className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3 rounded-lg"
            >
              CRIAR CONTA
            </Link>
          </div>
    </div>
      </section>
    </>
  );
}
