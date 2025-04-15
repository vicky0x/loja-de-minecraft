import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  // Jogos populares
  const popularGames = [
    {
      id: 1,
      name: 'Valorant',
      image: 'https://wallpapercave.com/wp/wp6582758.jpg',
      slug: 'valorant',
    },
    {
      id: 2,
      name: 'Counter-Strike 2',
      image: 'https://wallpapercave.com/wp/wp12624501.jpg',
      slug: 'cs2',
    },
    {
      id: 3,
      name: 'Apex Legends',
      image: 'https://wallpapercave.com/wp/wp4246717.jpg',
      slug: 'apex-legends',
    },
    {
      id: 4,
      name: 'PUBG',
      image: 'https://wallpapercave.com/wp/wp9493309.jpg',
      slug: 'pubg',
    },
    {
      id: 5,
      name: 'Fortnite',
      image: 'https://wallpapercave.com/wp/wp8659599.jpg',
      slug: 'fortnite',
    },
    {
      id: 6,
      name: 'Call of Duty',
      image: 'https://wallpapercave.com/wp/wp11790450.jpg',
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
              FANTASY STORE
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
                className="relative overflow-hidden group bg-transparent border-2 border-primary text-primary hover:text-white text-center text-lg px-10 py-4 rounded-xl font-medium transition-all duration-300 ease-in-out"
              >
                <span className="relative z-10 flex items-center justify-center">
                  EXPLORAR PRODUTOS
                  <svg className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></span>
              </Link>
              <Link 
                href="/auth/register" 
                className="relative overflow-hidden group bg-transparent border-2 border-white/20 text-white hover:border-white/40 text-center text-lg px-10 py-4 rounded-xl font-medium transition-all duration-300 ease-in-out"
              >
                <span className="relative z-10 flex items-center justify-center">
                  CRIAR CONTA
                  <svg className="w-5 h-5 ml-2 opacity-0 transform transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <span className="absolute inset-0 bg-white/5 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></span>
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6" id="jogos-disponiveis">
            {popularGames.map((game) => (
              <Link key={game.id} href={`/products/games/${game.slug}`}>
                <div className="bg-dark-300 rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                  <div className="h-36 bg-dark-400 relative flex items-center justify-center">
                    <img 
                      src={game.image} 
                      alt={game.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                      }}
                    />
                    <span className="text-4xl font-bold text-primary bg-dark-900/70 w-12 h-12 rounded-full flex items-center justify-center z-10">{game.name.charAt(0)}</span>
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

      {/* Avaliações de Usuários */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">O QUE NOSSOS CLIENTES DIZEM</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Veja a experiência de quem já utiliza nossos produtos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-dark-200 rounded-xl transition-all hover:bg-dark-300">
              <div className="flex items-center mb-4">
                <img 
                  src="https://randomuser.me/api/portraits/men/32.jpg" 
                  alt="Gabriel M."
                  className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                />
                <div>
                  <h3 className="font-bold text-lg">Gabriel M.</h3>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "Uso o cheat para Valorant há 3 meses e nunca tive problemas com banimento. O aimbot é discreto e o ESP mostra exatamente o que preciso. Atendimento rápido quando precisei de ajuda com a instalação."
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-2">Cliente há 3 meses</span>
                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Valorant</span>
              </div>
            </div>

            <div className="p-6 bg-dark-200 rounded-xl transition-all hover:bg-dark-300">
              <div className="flex items-center mb-4">
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="Juliana R."
                  className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                />
                <div>
                  <h3 className="font-bold text-lg">Juliana R.</h3>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "Comecei a usar o cheat para CS2 depois que meus amigos recomendaram. A diferença no meu gameplay foi absurda! O wallhack é perfeito e o sistema anti-detecção realmente funciona. Já renovei minha assinatura duas vezes."
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-2">Cliente há 6 meses</span>
                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">CS2</span>
              </div>
            </div>

            <div className="p-6 bg-dark-200 rounded-xl transition-all hover:bg-dark-300">
              <div className="flex items-center mb-4">
                <img 
                  src="https://randomuser.me/api/portraits/men/75.jpg" 
                  alt="Lucas T."
                  className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                />
                <div>
                  <h3 className="font-bold text-lg">Lucas T.</h3>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4].map((star) => (
                      <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "O cheat para Fortnite é muito bom, mas tive alguns problemas com a configuração inicial. O suporte me ajudou a resolver rapidamente. A função de auto-build é incrível e me ajudou a ganhar várias partidas. Só acho que poderia ter mais opções de personalização."
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-2">Cliente há 2 meses</span>
                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Fortnite</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/reviews" 
              className="text-primary hover:underline flex items-center justify-center"
            >
              Ver mais avaliações
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-dark-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">O QUE DIZEM NOSSOS CLIENTES</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Veja o que nossa comunidade tem a dizer sobre a Fantasy Store
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
                "Tentei vários outros cheats antes, mas a Fantasy Store está em outro nível. As atualizações são rápidas e o anti-ban realmente funciona!"
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
                <h3 className="text-xl font-bold mb-3">É seguro usar os cheats da Fantasy Store?</h3>
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
              className="relative overflow-hidden group bg-white text-primary hover:text-primary-dark text-lg px-8 py-3 rounded-xl font-medium transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10 flex items-center justify-center">
                EXPLORAR PRODUTOS
                <svg className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <span className="absolute inset-0 bg-white/90 hover:bg-white transform scale-x-100 group-hover:scale-x-100 transition-all duration-500"></span>
            </Link>
            <Link 
              href="/auth/register" 
              className="relative overflow-hidden group bg-transparent border-2 border-white text-white hover:border-white/80 text-lg px-8 py-3 rounded-xl font-medium transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10 flex items-center justify-center">
                CRIAR CONTA
                <svg className="w-5 h-5 ml-2 opacity-0 transform transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <span className="absolute inset-0 bg-white/10 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
} 