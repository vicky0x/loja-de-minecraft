import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';

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

  // Estatísticas
  const stats = [
    { value: '98%', label: 'Taxa de Satisfação' },
    { value: '24/7', label: 'Suporte Técnico' },
    { value: '10k+', label: 'Usuários Ativos' }
  ];

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex items-center min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-dark-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,96,0,0.15),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px] opacity-10"></div>
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 animate-fade-in">
              <h1 className="text-gradient text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
                FANTASY CHEATS
              </h1>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6">
                DOMINE CADA <span className="text-primary">PARTIDA</span>
              </h2>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Eleve seu desempenho nos jogos com nossa tecnologia avançada. 
                Segurança garantida, suporte 24/7 e interface intuitiva.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link 
                href="/products" 
                className="btn-primary py-4 px-8 font-medium text-lg group"
              >
                <span className="flex items-center justify-center">
                  EXPLORAR PRODUTOS
                  <svg className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              <Link 
                href="/auth/register" 
                className="btn-outline py-4 px-8 font-medium text-lg"
              >
                CRIAR CONTA
              </Link>
            </div>
            
            {/* Estatísticas animadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {stats.map((stat, index) => (
                <div key={index} className="glass-card transform transition-all duration-500 hover:scale-105">
                  <div className="text-5xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Seta de scroll */}
            <div className="animate-subtle-bounce absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <svg className="w-10 h-10 text-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Jogos Disponíveis */}
      <section className="py-24 bg-dark-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="title-underline title-underline-center text-3xl md:text-4xl font-bold inline-block mb-6">
              JOGOS DISPONÍVEIS
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Soluções premium para os jogos mais populares do mercado
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {popularGames.map((game, index) => (
              <Link key={game.id} href={`/products/games/${game.slug}`} className="block">
                <div className="card-hover aspect-square flex flex-col items-center justify-center group transform transition-all duration-500 hover:translate-y-[-8px]">
                  <div className="relative mb-4 overflow-hidden rounded-lg w-16 h-16 flex items-center justify-center bg-dark-400 group-hover:ring-2 group-hover:ring-primary transition-all duration-300">
                    {game.image && (
                      <div className="absolute inset-0 bg-dark-400 flex items-center justify-center">
                        <span className="font-bold text-xl text-center">{game.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors duration-300 text-center">{game.name}</h3>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/products" 
              className="group inline-flex items-center text-primary hover:text-primary-light transition-colors"
            >
              <span>Ver todos os jogos disponíveis</span>
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
      
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="title-underline title-underline-center text-3xl md:text-4xl font-bold inline-block mb-6">
              NOSSOS DIFERENCIAIS
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Por que escolher a Fantasy Cheats para suas vantagens competitivas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="hover-lift">
                <div className="glass-card h-full flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
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
                  <h3 className="text-xl font-semibold mb-4 text-primary">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_70%)]"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-md">
            PRONTO PARA DOMINAR?
          </h2>
          <p className="text-white text-xl mb-10 max-w-2xl mx-auto">
            Junte-se a milhares de jogadores que já aumentaram seu desempenho com nossa tecnologia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/products" 
              className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4 rounded-lg inline-flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-white/20 font-medium"
            >
              EXPLORAR PRODUTOS
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-4 rounded-lg inline-flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-white/20 font-medium"
            >
              CRIAR CONTA
            </Link>
          </div>
        </div>
      </section>
      
      {/* FAQ - Simplificado */}
      <section className="py-24 bg-dark-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="title-underline title-underline-center text-3xl md:text-4xl font-bold inline-block mb-6">
              PERGUNTAS FREQUENTES
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Respostas para as principais dúvidas sobre nossos produtos
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              <details className="group">
                <summary className="text-xl font-semibold p-5 bg-dark-300 rounded-lg cursor-pointer">
                  É seguro usar os cheats da Fantasy Cheats?
                </summary>
                <div className="p-5 bg-dark-300/50 rounded-b-lg">
                  <p className="text-gray-300">
                    Sim, todos os nossos cheats são desenvolvidos com tecnologia anti-detecção avançada. 
                    Mesmo assim, recomendamos sempre seguir nossas diretrizes de uso para maior segurança.
                  </p>
                </div>
              </details>
              
              <details className="group">
                <summary className="text-xl font-semibold p-5 bg-dark-300 rounded-lg cursor-pointer">
                  Quanto tempo leva para receber acesso após a compra?
                </summary>
                <div className="p-5 bg-dark-300/50 rounded-b-lg">
                  <p className="text-gray-300">
                    O acesso é instantâneo após a confirmação do pagamento. 
                    Você receberá um email com instruções de como acessar sua área do cliente.
                  </p>
                </div>
              </details>
              
              <details className="group">
                <summary className="text-xl font-semibold p-5 bg-dark-300 rounded-lg cursor-pointer">
                  Os cheats funcionam em qualquer computador?
                </summary>
                <div className="p-5 bg-dark-300/50 rounded-b-lg">
                  <p className="text-gray-300">
                    Nossos cheats são otimizados para funcionarem na maioria dos computadores. 
                    Os requisitos mínimos estão detalhados na página de cada produto.
                  </p>
                </div>
              </details>
            </div>
            
            <div className="text-center mt-8">
              <Link 
                href="/faq" 
                className="text-primary hover:text-primary-light inline-flex items-center group"
              >
                <span>Ver mais perguntas frequentes</span>
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer minimalista */}
      <footer className="bg-dark-300 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Logo e descrição */}
            <div>
              <Link href="/" className="inline-block mb-4">
                <span className="text-primary font-bold text-2xl">Fantasy Cheats</span>
              </Link>
              <p className="text-gray-400 mb-6">
                A melhor experiência em cheats para jogos, com segurança, qualidade e suporte incomparáveis.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0C5.282 16.736 5.017 15.622 5 12c.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0C18.718 7.264 18.982 8.378 19 12c-.018 3.629-.285 4.736-2.559 4.892zM10 9.658l4.917 2.338L10 14.342V9.658z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.016 18.466h-2.988v-4.648c0-1.119-.023-2.55-1.556-2.55-1.557 0-1.795 1.218-1.795 2.462v4.736H7.698V8.146h2.874v1.311h.039c.585-1.043 1.615-1.56 2.747-1.533 2.939 0 3.475 1.936 3.475 4.448v6.094h.183zM6.729 6.923a1.73 1.73 0 11.001-3.46 1.73 1.73 0 01-.001 3.46zm1.493 11.543H5.242V8.146h2.98v10.32z" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Links rápidos */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-gray-400 hover:text-primary transition-colors">
                    Produtos
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-primary transition-colors">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-primary transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Jogos Populares */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Jogos Populares</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/products/games/valorant" className="text-gray-400 hover:text-primary transition-colors">
                    Valorant
                  </Link>
                </li>
                <li>
                  <Link href="/products/games/cs2" className="text-gray-400 hover:text-primary transition-colors">
                    Counter-Strike 2
                  </Link>
                </li>
                <li>
                  <Link href="/products/games/apex-legends" className="text-gray-400 hover:text-primary transition-colors">
                    Apex Legends
                  </Link>
                </li>
                <li>
                  <Link href="/products/games/fortnite" className="text-gray-400 hover:text-primary transition-colors">
                    Fortnite
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contato */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Contato</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-3 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400">contato@fantasycheats.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-3 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-400">Atendimento: 24 horas</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="divider opacity-10"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-4">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Fantasy Cheats. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Termos de Serviço
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
