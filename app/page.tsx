"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

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

  // Produtos disponíveis
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para buscar produtos do backend
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?limit=9');
        if (!response.ok) {
          throw new Error('Falha ao carregar produtos');
        }
        const data = await response.json();
        setAvailableProducts(data.products || []);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calcular desconto com base no preço original e atual
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= 0 || !price) return 0;
    const discount = ((originalPrice - price) / originalPrice) * 100;
    return Math.round(discount);
  };

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
    { 
      value: '98', 
      label: 'Taxa de Satisfação', 
      suffix: '%', 
      description: 'Clientes satisfeitos com nossos serviços',
      icon: 'star'
    },
    { 
      value: '24/7', 
      label: 'Suporte Técnico', 
      description: 'Assistência disponível a qualquer momento',
      icon: 'support'
    },
    { 
      value: '4k+', 
      label: 'Contas Vendidas', 
      description: 'Jogadores utilizando nossos produtos',
      icon: 'users'
    },
    { 
      value: '4+', 
      label: 'Anos de Experiência', 
      description: 'Fornecendo soluções de alta qualidade',
      icon: 'calendar'
    }
  ];

  // Perguntas frequentes
  const faqs = [
    { 
      question: 'O que são contas de Minecraft?', 
      answer: 'Contas de Minecraft são acessos a contas originais com acesso completo ao jogo, permitindo acesso a recursos premium e evitando restrições de acesso.' 
    },
    { 
      question: 'Como funciona o processo de compra?', 
      answer: 'Após a compra, você receberá um acesso à sua área de cliente onde poderá baixar o software e receber instruções detalhadas de instalação e uso.' 
    },
    { 
      question: 'Vocês oferecem suporte técnico?', 
      answer: 'Sim, oferecemos suporte técnico 24/7 para todos os nossos clientes através de nossa plataforma de tickets e Discord.' 
    }
  ];

  const [openFaqs, setOpenFaqs] = useState([]);

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  return (
    <main className="flex flex-col min-h-screen bg-dark-100">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-screen overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-dark-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,96,0,0.08),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px] opacity-5"></div>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10%] opacity-30 blur-3xl bg-gradient-to-br from-transparent via-primary/5 to-transparent transform rotate-12"></div>
          </div>
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Title */}
            <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              {/* Badge premium */}
              <div className="inline-flex items-center px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/30 backdrop-blur-md border border-primary/40 text-white text-sm font-medium group relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,96,0,0.35)] hover:scale-[1.03] shadow-[0_0_12px_rgba(0,0,0,0.15)] animate-pulse-subtle">
                {/* Brilho de fundo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md"></div>
                
                {/* Efeito de partículas animadas */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1 left-3 w-1 h-1 rounded-full bg-white/40 animate-float-fast"></div>
                  <div className="absolute bottom-2 right-10 w-1 h-1 rounded-full bg-primary/40 animate-float-medium"></div>
                  <div className="absolute top-3 right-5 w-1.5 h-1.5 rounded-full bg-yellow-400/30 animate-float-slow"></div>
                  <div className="absolute bottom-1 left-10 w-0.5 h-0.5 rounded-full bg-white/30 animate-ping"></div>
                </div>
                
                {/* Badge #1 estilizada - sem a bola circular */}
                <div className="flex items-center justify-center mr-1 relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 animate-pulse-fast"></div>
                  <div className="relative z-10 font-black text-primary flex items-center justify-center bg-gradient-to-br from-yellow-400 to-primary p-0.5 h-6">
                    <span className="bg-dark-100/90 h-[calc(100%-2px)] px-1.5 flex items-center justify-center text-yellow-400 font-extrabold">
                      #1
                    </span>
                  </div>
                </div>
                
                {/* Texto principal com efeito de brilho */}
                <div className="relative z-10 font-medium text-white/95 tracking-wide group-hover:text-white transition-all duration-300 ml-1">
                  <span className="relative inline-block group-hover:animate-text-glow">
                    A Maior Loja de Minecraft
                    <span className="font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300"> da América Latina</span>
                  </span>
                </div>
                
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                {/* Efeito de reflexo no hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-full group-hover:translate-y-0"></div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                Fantasy Store
              </h1>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 tracking-wide">
                Minecraft <span className="text-primary">Premium</span>
              </h2>
              <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Compre contas originais Minecraft Java e Bedrock com acesso completo.
                Entrega automática e garantia permanente pelo menor preço do Brasil.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <Link 
                href="/products" 
                className="group relative overflow-hidden py-3 px-8 rounded-md bg-gradient-to-r from-primary/10 to-primary/20 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:translate-y-[-2px]"
              >
                {/* Fundo dinâmico */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/80 to-primary-dark/90 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out"></span>
                
                {/* Efeito de brilho nas bordas */}
                <span className="absolute inset-0 w-full h-full border border-primary/30 group-hover:border-primary/60 rounded-md transition-all duration-300"></span>
                
                {/* Partículas */}
                <span className="absolute top-1/4 left-[10%] w-1 h-1 bg-primary/80 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></span>
                <span className="absolute bottom-1/3 right-[15%] w-1 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{ animationDelay: '0.5s' }}></span>
                
                {/* Texto e ícone */}
                <span className="relative z-10 flex items-center justify-center text-primary group-hover:text-white font-medium tracking-wide text-sm transition-colors duration-300">
                  EXPLORAR CONTAS
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1.5 transition-all duration-500 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              
              <Link 
                href="/auth/register" 
                className="group relative overflow-hidden py-3 px-8 rounded-md border border-primary/30 text-primary font-medium tracking-wide text-sm bg-dark-100/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:text-white hover:shadow-lg hover:shadow-primary/10 hover:translate-y-[-2px]"
              >
                {/* Efeito de preenchimento */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/80 to-primary-dark/90 transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-in-out"></span>
                
                {/* Efeito de brilho diagonal */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-full group-hover:translate-x-[-100%]"></span>
                
                {/* Partículas */}
                <span className="absolute top-1/3 right-[10%] w-1 h-1 bg-primary/80 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></span>
                <span className="absolute bottom-1/4 left-[15%] w-1 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{ animationDelay: '0.7s' }}></span>
                
                {/* Texto e ícone */}
                <span className="relative z-10 flex items-center justify-center transition-colors duration-300">
                  CRIAR CONTA
                  <svg className="w-4 h-4 ml-2 opacity-0 transform group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-500 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </span>
              </Link>
            </div>
            
            {/* Animated Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="text-center p-6 transition-all duration-500 hover:scale-105"
                >
                  <div className="text-5xl font-bold text-white mb-2">
                    {stat.value}{stat.value === '98' ? '%' : ''}
                  </div>
                  <div className="text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scroll Down Arrow */}
            <div className="flex justify-center mb-12 opacity-0 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              <a 
                href="#jogos-disponiveis" 
                className="text-primary hover:text-primary-light transition-colors duration-300"
                aria-label="Ver jogos disponíveis"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('jogos-disponiveis')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 animate-pulse" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Jogos Disponíveis */}
      <section className="py-20 bg-dark-100 relative overflow-hidden" id="jogos-disponiveis">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-3xl md:text-4xl font-bold inline-block mb-6 relative">
              JOGOS DISPONÍVEIS
              <span className="absolute -bottom-2 left-1/2 w-24 h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light transform -translate-x-1/2 rounded-full"></span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Conheça alguns dos jogos em que oferecemos vantagens competitivas
            </p>
          </div>
          
          {/* Produtos em destaque */}
          <h3 className="text-2xl font-bold mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            Produtos em Destaque
          </h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
              {availableProducts.slice(0, 4).map((product, index) => {
                // Determinar se o produto tem variantes ou preço direto
                const hasVariants = product.variants && product.variants.length > 0;
                const lowestPrice = hasVariants 
                  ? Math.min(...product.variants.map(v => v.price)) 
                  : product.price;
                
                const stock = hasVariants
                  ? product.variants.reduce((total, v) => total + (v.stock || 0), 0)
                  : product.stock || 0;
                
                const imageUrl = product.images && product.images.length > 0 
                  ? product.images[0].startsWith('http') ? product.images[0] : `${product.images[0]}`
                  : 'https://placehold.co/600x400/222/444?text=Sem+Imagem';
                
                // Calcular desconto
                const discount = product.discountPercentage
                  ? product.discountPercentage
                  : calculateDiscount(lowestPrice, product.originalPrice);
                
                return (
                  <div 
                    key={product._id} 
                    className="bg-gradient-to-b from-dark-300/90 to-dark-200 rounded-xl overflow-hidden shadow-md transition-all duration-400 hover:shadow-xl hover:shadow-dark-400/30 product-card" 
                    style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
                  >
                    <div className="relative rounded-lg overflow-hidden z-10">
                      {/* Badge de estoque */}
                      <div className={`absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full z-20 backdrop-blur-xl shadow-sm ${
                        stock <= 0 ? 'bg-red-900/70 text-red-200 border border-red-500/40' :
                        stock <= 5 ? 'bg-yellow-900/70 text-yellow-200 border border-yellow-500/40' :
                        'bg-dark-800/70 text-green-300 border border-green-500/40'
                      }`}>
                        {stock <= 0 ? 'Esgotado' :
                         stock <= 5 ? 'Últimas unidades' :
                         stock <= 10 ? 'Estoque baixo' :
                         'Disponível'}
                      </div>
                      
                      {/* Container da imagem com padding */}
                      <div className="pt-3 px-3 pb-0 bg-gradient-to-br from-dark-800 to-dark-900">
                        {/* Imagem sem efeito de zoom */}
                        <div className="h-52 relative overflow-hidden rounded-lg product-card-image">
                          <div className="absolute inset-0 z-0 overflow-hidden">
                            <div className="bg-gradient-to-br from-dark-800 to-dark-900 h-full w-full opacity-90"></div>
                            {/* Padrão sutil no fundo */}
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                          </div>
                          
                          <img 
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover relative z-10 transition-all duration-500"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = 'https://placehold.co/600x400/111/222?text=Imagem+Indisponível';
                            }}
                          />
                          
                          {/* Gradiente na parte inferior para melhorar transição com o conteúdo */}
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-dark-300/90 to-transparent z-10"></div>
                        </div>
                      </div>
                      
                      {/* Badge de destaque com animação mais sutil */}
                      {product.featured && (
                        <div className="absolute top-4 left-4 bg-dark-800/80 text-white text-xs font-medium px-3 py-1 rounded-full z-20 flex items-center border border-primary/30 shadow-sm transition-all duration-300">
                          <span className="mr-1.5 inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                          Destaque
                        </div>
                      )}
                      
                      {/* Badge de status com efeito mais sutil */}
                      {product.status === 'indetectavel' && (
                        <div className="absolute bottom-[53px] left-4 bg-dark-800/80 text-green-300 border border-green-500/30 text-xs px-3 py-1 rounded-full flex items-center backdrop-blur-xl z-20 shadow-sm transition-all duration-300">
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Indetectável
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col justify-between h-48 relative z-10 bg-gradient-to-b from-dark-300/90 to-dark-200">
                      {/* Título com efeito mais sutil */}
                      <div className="relative">
                        <h3 className="text-white font-medium text-base mb-3 group-hover:text-primary transition-colors duration-300">{product.name}</h3>
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary/30 group-hover:w-1/4 transition-all duration-500"></span>
                      </div>
                      
                      <div>
                        <div className="flex items-baseline mb-3 relative">
                          {hasVariants ? (
                            <span className="text-primary font-bold text-xl transition-all duration-300">{`R$ ${lowestPrice.toFixed(2).replace('.', ',')}`}</span>
                          ) : (
                            <span className="text-primary font-bold text-xl transition-all duration-300">{`R$ ${lowestPrice.toFixed(2).replace('.', ',')}`}</span>
                          )}
                          
                          {product.originalPrice && product.originalPrice > 0 && (
                            <span className="text-gray-400 line-through text-sm ml-2">
                              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          
                          {discount > 0 && (
                            <span className="ml-auto bg-green-900/40 text-green-300 text-xs px-2.5 py-1 rounded-full border border-green-500/20 shadow-sm transition-all duration-300">
                              -{Math.round(discount)}%
                            </span>
                          )}
                        </div>
                        
                        <Link href={`/product/${product.slug}`} className="block mt-3">
                          <button 
                            disabled={stock <= 0}
                            className={`product-card-button w-full py-2.5 px-4 rounded-lg text-center font-medium transition-all duration-300 relative overflow-hidden ${
                              stock <= 0 
                              ? 'bg-dark-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-primary text-white hover:bg-primary-dark group-hover:shadow-md'
                            }`}
                          >
                            {stock <= 0 ? 'Esgotado' : (
                              <>
                                <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">Ver detalhes</span>
                                <span className="btn-underline absolute bottom-0 left-1/2 right-1/2 h-[1px] bg-white/20 group-hover:left-4 group-hover:right-4 transition-all duration-500"></span>
                              </>
                            )}
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12 opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <a 
              href="/games" 
              className="inline-flex items-center text-primary hover:text-white px-6 py-3 rounded-lg bg-dark-200/50 hover:bg-primary/20 backdrop-blur-sm border border-dark-300 hover:border-primary/30 transition-all duration-300 group"
            >
              <span className="relative">
                Ver todos os jogos disponíveis
                <span className="absolute bottom-0 left-0 w-full h-1 bg-primary/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </span>
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-100/0 via-primary/5 to-dark-100/0"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10%] opacity-10 blur-3xl bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 transform rotate-12"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-3xl md:text-4xl font-bold inline-block mb-6 relative">
              NOSSOS NÚMEROS
              <span className="absolute -bottom-2 left-1/2 w-24 h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light transform -translate-x-1/2 rounded-full"></span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Estatísticas que comprovam nossa qualidade e confiabilidade
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="opacity-0 animate-fade-in-up" 
                style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <div className="relative bg-dark-200 rounded-xl p-6 h-full flex flex-col items-center text-center border border-dark-300 hover:border-primary/30 transition-all duration-500 group overflow-hidden">
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Icon */}
                  <div className="mb-4 relative">
                    <div className="w-16 h-16 rounded-full bg-dark-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-dark-400 group-hover:border-primary/30">
                      <span className="text-primary text-2xl group-hover:text-white transition-colors duration-300">
                        {stat.icon === 'star' && (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        {stat.icon === 'support' && (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                        {stat.icon === 'users' && (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                        {stat.icon === 'calendar' && (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </span>
                    </div>
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-primary/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  {/* Stat Value with Counter Animation */}
                  <div className="relative mb-2">
                    <span style={{ color: '#ff6000', fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem', textShadow: '0 0 5px rgba(0,0,0,0.3)' }}>
                      {stat.value}
                      {stat.suffix && <span className="text-2xl ml-1">{stat.suffix}</span>}
                    </span>
                  </div>
                  
                  {/* Stat Label */}
                  <h3 className="text-xl font-medium text-white mb-2 group-hover:text-primary transition-colors duration-300">{stat.label}</h3>
                  
                  {/* Stat Description */}
                  <p className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300">{stat.description}</p>
                  
                  {/* Bottom Decoration */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10%] opacity-10 blur-3xl bg-gradient-to-br from-transparent via-primary/5 to-transparent transform rotate-12"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-3xl md:text-4xl font-bold inline-block mb-6 relative">
              O QUE NOSSOS CLIENTES DIZEM
              <span className="absolute -bottom-2 left-1/2 w-24 h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light transform -translate-x-1/2 rounded-full"></span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Veja a experiência de quem já utiliza nossos produtos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <div className="relative bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 h-full border border-dark-300 hover:border-primary/20 transition-all duration-500 group overflow-hidden">
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-center mb-4 relative z-10">
                  <img 
                    src="https://randomuser.me/api/portraits/men/32.jpg" 
                    alt="Gabriel M."
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">Gabriel M.</h3>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 relative z-10">
                  "Uso o cheat para Valorant há 3 meses e nunca tive problemas com banimento. O aimbot é discreto e o ESP mostra exatamente o que preciso. Atendimento rápido quando precisei de ajuda com a instalação."
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2">Cliente há 3 meses</span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Valorant</span>
                </div>
                
                {/* Bottom Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>

            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <div className="relative bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 h-full border border-dark-300 hover:border-primary/20 transition-all duration-500 group overflow-hidden">
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-center mb-4 relative z-10">
                  <img 
                    src="https://randomuser.me/api/portraits/women/44.jpg" 
                    alt="Juliana R."
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">Juliana R.</h3>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 relative z-10">
                  "Comecei a usar o cheat para CS2 depois que meus amigos recomendaram. A diferença no meu gameplay foi absurda! O wallhack é perfeito e o sistema anti-detecção realmente funciona. Já renovei minha assinatura duas vezes."
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2">Cliente há 6 meses</span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">CS2</span>
                </div>
                
                {/* Bottom Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>

            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              <div className="relative bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 h-full border border-dark-300 hover:border-primary/20 transition-all duration-500 group overflow-hidden">
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-center mb-4 relative z-10">
                  <img 
                    src="https://randomuser.me/api/portraits/men/75.jpg" 
                    alt="Lucas T."
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">Lucas T.</h3>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4].map((star) => (
                        <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 relative z-10">
                  "O cheat para Fortnite é muito bom, mas tive alguns problemas com a configuração inicial. O suporte me ajudou a resolver rapidamente. A função de auto-build é incrível e me ajudou a ganhar várias partidas. Só acho que poderia ter mais opções de personalização."
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2">Cliente há 2 meses</span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Fortnite</span>
                </div>
                
                {/* Bottom Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
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
              className="relative overflow-hidden group bg-transparent border-2 border-primary text-white text-lg px-8 py-4 rounded-xl font-medium transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10 flex items-center justify-center">
                EXPLORAR CONTAS
                <svg className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <span className="absolute inset-0 bg-primary transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></span>
            </Link>
            <Link 
              href="/auth/register" 
              className="relative overflow-hidden group bg-transparent border-2 border-white/50 text-white hover:border-white text-lg px-8 py-4 rounded-xl font-medium transition-all duration-300 ease-in-out"
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
      
      {/* FAQ */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-100/0 via-primary/5 to-dark-100/0"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10%] opacity-10 blur-3xl bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 transform rotate-12"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-3xl md:text-4xl font-bold inline-block mb-6 relative">
              PERGUNTAS FREQUENTES
              <span className="absolute -bottom-2 left-1/2 w-24 h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light transform -translate-x-1/2 rounded-full"></span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Respostas para as dúvidas mais comuns sobre nossos produtos e serviços
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="mb-5 faq-card"
                data-faq-index={index}
              >
                <div className="bg-dark-200/80 rounded-xl overflow-hidden border border-dark-300">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none"
                    aria-expanded={openFaqs.includes(index)}
                    aria-controls={`faq-content-${index}`}
                  >
                    <div className="flex items-center pr-4">
                      <div className={`w-1 h-8 rounded-full mr-4 ${openFaqs.includes(index) ? 'bg-primary' : 'bg-dark-400'}`}></div>
                      <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                    </div>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${openFaqs.includes(index) ? 'bg-primary/20 text-primary rotate-180' : 'bg-dark-400/50 text-white'}`}>
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  <div 
                    id={`faq-content-${index}`}
                    className="faq-content"
                  >
                    <div className="px-6 py-5 pl-[57px] text-gray-300 border-t border-dark-400/20">
                      <p className="leading-relaxed">{faq.answer}</p>
                      
                      <div className="mt-4 pt-3 border-t border-dark-400/10 flex items-center text-xs text-gray-400">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-primary/70 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Informação útil
                        </div>
                        <div className="ml-auto flex items-center">
                          <svg className="w-4 h-4 text-primary/70 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Atualizado recentemente
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-dark-100 border-t border-dark-300 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px]"></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4 text-white relative inline-block">
                  Fantasy Store
                  <span className="absolute -bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
                </h3>
                <p className="text-gray-300 mb-4">
                  Fornecendo vantagens competitivas para jogadores desde 2018. Qualidade e segurança são nossa prioridade.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300 transform hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12a12 12 0 1 1-12 12 12 12 0 0 1 12-12z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300 transform hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300 transform hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002 2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300 transform hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <h3 className="text-lg font-semibold mb-4 text-white relative inline-block">
                Links Rápidos
                <span className="absolute -bottom-1 left-0 w-8 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-primary transition-colors duration-300 flex items-center group">
                    <span className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                    Início
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-primary transition-colors duration-300 flex items-center group">
                    <span className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                    Jogos
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-primary transition-colors duration-300 flex items-center group">
                    <span className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-primary transition-colors duration-300 flex items-center group">
                    <span className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-primary transition-colors duration-300 flex items-center group">
                    <span className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                    Contato
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <h3 className="text-lg font-semibold mb-4 text-white relative inline-block">
                Jogos Populares
                <span className="absolute -bottom-1 left-0 w-8 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
              </h3>
              <ul className="space-y-2">
                {popularGames.slice(0, 5).map((game, index) => (
                  <li key={index}>
                    <a href={`/games/${game.slug}`} className="text-gray-300 hover:text-primary transition-colors duration-300 flex items-center group">
                      <span className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                      {game.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <h3 className="text-lg font-semibold mb-4 text-white relative inline-block">
                Contato
                <span className="absolute -bottom-1 left-0 w-8 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002 2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-300">suporte@fantasycheats.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <span className="text-gray-300">Suporte via Discord</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300">Horário de Atendimento:<br />Seg - Dom: 24 horas</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-dark-300 pt-6 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} Fantasy Store. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-primary text-sm transition-colors duration-300">Termos de Uso</a>
                <a href="#" className="text-gray-400 hover:text-primary text-sm transition-colors duration-300">Política de Privacidade</a>
                <a href="#" className="text-gray-400 hover:text-primary text-sm transition-colors duration-300">Reembolso</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
