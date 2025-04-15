"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import ProductList from './components/ProductList';

export default function Home() {
  // Estado para armazenar os IDs dos produtos em destaque
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar os IDs dos produtos em destaque
  useEffect(() => {
    async function fetchFeaturedProductIds() {
      try {
        const response = await fetch('/api/featuredProducts');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.featuredProducts)) {
            setSelectedProductIds(data.featuredProducts);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar produtos em destaque:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProductIds();
  }, []);

  // Features do produto
  const features = [
    {
      icon: 'shield',
      title: 'Entrega Imediata',
      description: 'Receba sua conta de Minecraft Original imediatamente após a confirmação do pagamento'
    },
    {
      icon: 'update',
      title: 'Garantia de até 365 dias',
      description: 'Todas as nossas contas originais de Minecraft possuem garantia de até 365 dias contra problemas'
    },
    {
      icon: 'support',
      title: 'Suporte 24/7',
      description: 'Nossa equipe de suporte está sempre disponível para ajudar com qualquer dúvida ou problema'
    },
    {
      icon: 'interface',
      title: 'Full Acesso Garantido',
      description: 'Contas Microsoft com acesso completo - altere e-mail, senha, nick e skin como quiser'
    }
  ];

  // Estatísticas
  const stats = [
    { 
      value: '98', 
      label: 'Taxa de Satisfação', 
      suffix: '%', 
      description: 'Clientes satisfeitos com nossas contas de Minecraft',
      icon: 'star'
    },
    { 
      value: '24/7', 
      label: 'Suporte Técnico', 
      description: 'Assistência disponível a qualquer momento',
      icon: 'support'
    },
    { 
      value: '5k+', 
      label: 'Contas Vendidas', 
      description: 'Jogadores utilizando nossas contas de Minecraft',
      icon: 'users'
    },
    { 
      value: '5+', 
      label: 'Anos de Experiência', 
      description: 'Fornecendo as melhores contas de Minecraft do Brasil',
      icon: 'calendar'
    }
  ];

  // Perguntas frequentes
  const faqs = [
    { 
      question: 'O que são contas de Minecraft Full Acesso?', 
      answer: 'Contas de Minecraft Full Acesso (FA) são contas Microsoft originais que oferecem acesso completo ao jogo, permitindo alterar e-mail, senha, nick, skin e jogar em todos os servidores das versões Java e Bedrock Edition do Minecraft.' 
    },
    { 
      question: 'Como funciona o processo de compra?', 
      answer: 'Após a confirmação do pagamento, você receberá automaticamente os dados de acesso da sua conta de Minecraft Original em nosso sistema e por e-mail. A entrega é imediata e 100% automática para maior comodidade. Caso não tenhamos estoque disponível para entrega automática no momento da compra, enviaremos sua conta em até 24h.' 
    },
    { 
      question: 'As contas têm garantia?', 
      answer: 'Sim! Todas as nossas contas de Minecraft originais possuem garantia de até 365 dias. Se acontecer qualquer problema com sua conta, nós substituímos por outra imediatamente, sem custos adicionais.' 
    },
    { 
      question: 'Posso alterar todos os dados da conta após a compra?', 
      answer: 'Sim, nas contas Full Acesso você recebe acesso completo, podendo alterar o e-mail, senha, nome de usuário (nick), skin e todos os outros dados da conta de Minecraft, tornando-a definitivamente sua.' 
    },
    { 
      question: 'A conta é original/legítima da Microsoft?', 
      answer: 'Sim, todas as nossas contas de Minecraft são 100% originais e legítimas da Microsoft, garantindo acesso completo a todas as funcionalidades do jogo, tanto na versão Java quanto na Bedrock Edition.' 
    },
    { 
      question: 'Qual a diferença entre a Fantasy Store e outras lojas de Minecraft?', 
      answer: 'A principal diferença está na origem e legitimidade das contas. Enquanto muitas lojas vendem contas adquiridas por meios ilegais ou contas roubadas, a Fantasy Store trabalha exclusivamente com fornecedores autorizados que são nossos parceiros oficiais. Nossas contas são 100% legítimas, o que nos permite oferecer garantia de até 365 dias. Além disso, temos suporte humano 24/7, preços competitivos e sistema de entrega automática, proporcionando uma experiência de compra segura e confiável.' 
    },
    { 
      question: 'Qual a diferença entre Minecraft Java e Bedrock?', 
      answer: 'O Minecraft Java Edition é a versão para computadores (Windows, Mac e Linux) com maior compatibilidade com mods e servidores. O Minecraft Bedrock Edition é a versão multiplataforma (PC, console e mobile) com suporte a crossplay. Nossas contas incluem AMBAS as versões!' 
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
      <section className="relative flex items-center justify-center min-h-screen overflow-hidden pt-10 md:pt-14">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-dark-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,96,0,0.08),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px] opacity-5"></div>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10%] opacity-30 blur-3xl bg-gradient-to-br from-transparent via-primary/5 to-transparent transform rotate-12"></div>
          </div>
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center mt-0">
            {/* Main Title */}
            <div className="mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              {/* Badge premium */}
              <div className="inline-flex items-center px-4 py-2 mb-3 rounded-full bg-gradient-to-r from-primary/20 to-primary/30 backdrop-blur-md border border-primary/40 text-white text-sm font-medium group relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,96,0,0.35)] hover:scale-[1.03] shadow-[0_0_12px_rgba(0,0,0,0.15)] animate-pulse-subtle">
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
                    A Maior Loja de Contas Originais de Minecraft
                    <span className="font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300"> do Brasil</span>
                  </span>
                </div>
                
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                {/* Efeito de reflexo no hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-full group-hover:translate-y-0"></div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                Minecraft Original Barato
              </h1>
              <h2 className="text-2xl md:text-4xl font-semibold mb-6 tracking-wide">
                Contas de Minecraft <span className="text-primary">Full Acesso</span> e <span className="text-primary">Originais</span>
              </h2>
              <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Contas de Minecraft original com as versões Java e Bedrock Edition, garantia e preço justo. Acesso completo, entrega imediata e suporte 24h.
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
                  EXPLORAR CONTAS DE MINECRAFT
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
              CONTAS DE MINECRAFT ORIGINAL
              <span className="absolute -bottom-2 left-1/2 w-24 h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light transform -translate-x-1/2 rounded-full"></span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Explore nossas contas originais de Minecraft com acesso completo e garantia de até 365 dias
            </p>
          </div>
          
          {/* Produtos em destaque */}
          <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <ProductList 
              selectedIds={selectedProductIds.length > 0 ? selectedProductIds : undefined}
              showTitle={true}
              title="Contas de Minecraft em Destaque" 
              limit={4}
            />
          </div>
          
          {/* Call to Action */}
          <div className="text-center mt-12 opacity-0 animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
            <Link 
              href="/products" 
              className="px-8 py-3 bg-dark-300 text-white rounded-lg inline-flex items-center hover:bg-dark-400 transition-colors"
            >
              ADQUIRA SUA CONTA MINECRAFT AGORA! 🔥
              <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
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
              Estatísticas que comprovam nossa qualidade e confiabilidade como a melhor loja de Minecraft do Brasil
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.07-3.292z" />
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

      {/* Por que comprar conosco */}
      <section className="py-24 relative overflow-hidden bg-dark-200">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,96,0,0.05),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#ff6000_1px,transparent_1px)] [background-size:40px_40px] opacity-5"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-3xl md:text-4xl font-bold inline-block mb-6 relative">
              Por que comprar conosco?
              <span className="absolute -bottom-2 left-1/2 w-24 h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light transform -translate-x-1/2 rounded-full"></span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Descubra alguns dos benefícios ao comprar uma conta em nosso site!
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Bloco de comparação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-100 border border-dark-300 rounded-xl overflow-hidden">
              <div className="p-6 border-b md:border-b-0 md:border-r border-dark-300">
                <div className="p-2 mb-6 inline-flex items-center justify-center bg-dark-300/50 rounded-lg">
                  <div className="px-3 py-1 bg-primary/20 text-primary rounded-md text-center font-semibold">
                    RECOMENDADO
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-8 h-8 relative">
                    <Image 
                      src="/fantasy_logo.png" 
                      alt="Fantasy Store Logo" 
                      width={32} 
                      height={32} 
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white">Fantasy Store</h3>
                </div>
                
                <ul className="space-y-4 text-gray-200">
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Conta original e completa por menos de R$70</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Contas antigas e raras</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Suporte humano 24/7</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Contas com capas e itens raros e exclusivos</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Garantia de até 365 dias</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Segurança e garantia total sobre a conta</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-6">
                <div className="p-2 mb-6 inline-flex items-center justify-center bg-dark-300/50 rounded-lg">
                  <div className="px-3 py-1 bg-dark-400 text-gray-300 rounded-md text-center font-semibold">
                    Comprando direto na Microsoft
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mb-5 opacity-0">
                  <span className="text-xl">🐻</span>
                  <h3 className="text-xl font-bold text-white">Outras lojas</h3>
                </div>
                
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-start space-x-3">
                    <span className="text-red-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <span>O jogo custa R$199</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-red-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <span>Conta recente e sem estatísticas</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-red-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <span>Suporte inexistente</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-red-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <span>Conta sem capas e itens</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-red-500 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <span>Sem segurança adicional</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Benefícios adicionais */}
            <div className="bg-dark-100 border border-dark-300 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Benefícios exclusivos Fantasy Store</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <li className="flex items-start space-x-3">
                  <span className="bg-primary/20 p-2 rounded-lg text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-white">Entrega instantânea</p>
                    <p className="text-sm text-gray-300">Receba sua conta em menos de 1 minuto após a confirmação. Caso não tenhamos estoque disponível, entrega em até 24h.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-primary/20 p-2 rounded-lg text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-white">Garantia de até 365 dias</p>
                    <p className="text-sm text-gray-300">Proteção contra problemas de acesso</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-primary/20 p-2 rounded-lg text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-white">Pagamento seguro</p>
                    <p className="text-sm text-gray-300">Múltiplas formas de pagamento com total segurança</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-primary/20 p-2 rounded-lg text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-white">Suporte 24/7</p>
                    <p className="text-sm text-gray-300">Equipe dedicada para ajudar com qualquer problema</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-primary/20 p-2 rounded-lg text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-white">Instruções detalhadas</p>
                    <p className="text-sm text-gray-300">Guias completos para configuração da sua conta</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-primary/20 p-2 rounded-lg text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-white">Melhor preço do Brasil</p>
                    <p className="text-sm text-gray-300">Contas premium com valores imbatíveis</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-8 text-center">
                <a 
                  href="/products" 
                  className="inline-flex items-center text-white px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark transition-all duration-300 group"
                >
                  <span>CONFERIR CONTAS DISPONÍVEIS</span>
                  <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
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
                    src="/fantasy_logo.png" 
                    alt="Pedrin"
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">Pedrin</h3>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 relative z-10">
                  "Loja muito confiável, super rápido o envio do produto! Comprei uma conta de Minecraft Premium e foi entregue em menos de 1 minuto. E o melhor de tudo é que a garantia é real, minha conta bugou e eles me deram outra na hora!"
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cliente verificado
                  </span>
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
                    src="/fantasy_logo.png" 
                    alt="João Gabriel"
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">João Gabriel</h3>
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
                  "simplesmente a melhor loja de contas de Minecraft de todas, o suporte é bom, a entrega é muito rápida, a minha conta chegou em 15 minutos, além de darem o acesso a todos os dados da conta e ter um preço bem acessível e é a única loja que eu confio em comprar o mine e recomendo a meus amigos"
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cliente verificado
                  </span>
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
                    src="/fantasy_logo.png" 
                    alt="David Luis"
                    className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">David Luis</h3>
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
                  "Literalmente a melhor loja de Minecraft que já comprei. Entrega totalmente automática e um suporte maravilhoso, sem sombras de dúvida a Fantasy é a melhor loja de contas de Minecraft Premium. Recomendo demais comprarem😍"
                </p>
                <div className="flex items-center text-sm text-gray-400 relative z-10">
                  <span className="mr-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cliente verificado
                  </span>
                </div>
                
                {/* Bottom Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          </div>
          
          {/* Texto explicativo sobre as avaliações */}
          <div className="text-center mt-10 max-w-3xl mx-auto opacity-0 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-semibold">Avaliações 100% Reais</span>
            </div>
            <p className="text-gray-300 text-sm">
              Todas as avaliações apresentadas são de clientes reais e foram retiradas da nossa página no Trustpilot, 
              a maior plataforma de avaliações do planeta. Conheça a experiência genuína de quem já comprou com a Fantasy Store.
            </p>
            <a 
              href="https://br.trustpilot.com/review/fantasystore.com.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center mt-3 text-primary hover:text-primary-light transition-colors text-sm"
            >
              Ver todas as avaliações
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 relative overflow-hidden">
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
