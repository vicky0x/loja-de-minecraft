"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import ProductList from './components/ProductList';

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
          
          <ProductList />

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
                    src="/images/avatars/isabela.jpg" 
                    alt="Isabela BR"
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://ui-avatars.com/api/?name=Isabela+BR&background=ff6000&color=fff';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">Isabela BR</h3>
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
                  "Thank you for your incredible service! I had been looking for my item for so long, it was my bfs present for our anniversary. I was glad to find it here. I am totally satisfied (and he too)"
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2">Cliente verificado</span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Minecraft</span>
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
                    src="/images/avatars/customer2.jpg" 
                    alt="Cliente Verificado"
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://ui-avatars.com/api/?name=Cliente+Verificado&background=ff6000&color=fff';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">Cliente Verificado</h3>
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
                  "Perfect service, reliable, responsive, and accurate accounts. I will return when I need more. Their Trustpilot score is well deserved, I'm very satisfied with my purchase."
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2">Cliente verificado</span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Minecraft</span>
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
                    src="/images/avatars/customer3.jpg" 
                    alt="Cliente Verificado"
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://ui-avatars.com/api/?name=Cliente+Verificado&background=ff6000&color=fff';
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">Cliente Verificado</h3>
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
                  "Reliable store with excellent customer service. I was skeptical at first, but after my purchase I'm very satisfied with how everything went. The accounts work as promised. Highly recommended!"
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2">Cliente verificado</span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Minecraft</span>
                </div>
                
                {/* Bottom Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
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
    </main>
  );
}
