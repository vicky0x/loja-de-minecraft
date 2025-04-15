'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Lista de nomes aleatórios para as notificações
const nomesFalsos = [
  'João Silva',
  'Maria Oliveira',
  'Pedro Santos',
  'Ana Souza',
  'Carlos Pereira',
  'Luciana Almeida',
  'Marcos Rodrigues',
  'Juliana Costa',
  'Roberto Ferreira',
  'Fernanda Lima',
  'Rafael Gomes',
  'Patrícia Martins',
  'Lucas Araújo',
  'Amanda Barbosa',
  'Bruno Cardoso',
  'Camila Ribeiro',
  'Daniel Carvalho',
  'Gabriela Teixeira',
  'Eduardo Moreira',
  'Flávia Castro',
  'Ricardo Nunes',
  'Bianca Oliveira',
  'Marcelo Dias',
  'Tatiana Cardoso',
  'Felipe Mendes',
  'Aline Torres',
  'Gustavo Reis',
  'Cristina Vidal',
  'José Nascimento',
  'Vanessa Campos',
  'André Monteiro',
  'Larissa Duarte',
  'Márcio Freitas',
  'Cláudia Ribeiro',
  'Paulo Andrade',
  'Luísa Marques',
  'Alexandre Costa',
  'Natália Melo',
  'Leonardo Alves',
  'Isabela Ramos',
  'Henrique Vieira',
  'Sabrina Rocha',
  'Renato Lopes',
  'Carolina Diniz',
  'Flávio Peixoto',
  'Letícia Fonseca',
  'Leandro Barros',
  'Mariana Guimarães',
  'Victor Sousa',
  'Eliane Nogueira'
];

// Interface do produto
interface Produto {
  _id: string;
  name: string;
  images: string[];
  price?: number;
}

const SalesNotification = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [notificacao, setNotificacao] = useState<{ 
    visivel: boolean; 
    nome: string; 
    produto: Produto | null; 
    horario: string;
    timeAgo: string;
  }>({
    visivel: false,
    nome: '',
    produto: null,
    horario: '',
    timeAgo: ''
  });

  // Buscar produtos reais do banco de dados
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const response = await fetch('/api/products?limit=10&sort=featured&dir=desc');
        if (response.ok) {
          const data = await response.json();
          if (data.products && Array.isArray(data.products)) {
            // Filtrar apenas produtos com imagens
            const produtosComImagens = data.products.filter(
              (p: Produto) => p.images && p.images.length > 0
            );
            setProdutos(produtosComImagens);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    fetchProdutos();
  }, []);

  // Função para gerar um horário aleatório nas últimas 24 horas
  const gerarHorarioAleatorio = () => {
    const agora = new Date();
    const minutosAtras = Math.floor(Math.random() * 24 * 60); // Até 24 horas atrás em minutos
    
    // Subtrair minutos
    const dataCompra = new Date(agora.getTime() - (minutosAtras * 60000));
    
    // Calcular texto relativo (há X minutos, há X horas)
    let timeAgo = '';
    
    if (minutosAtras < 60) {
      timeAgo = `${minutosAtras} min`;
    } else {
      const horas = Math.floor(minutosAtras / 60);
      timeAgo = `${horas} h`;
    }
    
    // Horário formatado
    const horario = `${dataCompra.getHours().toString().padStart(2, '0')}:${dataCompra.getMinutes().toString().padStart(2, '0')}`;
    
    return { horario, timeAgo };
  };

  // Função para gerar uma nova notificação
  const gerarNovaNotificacao = () => {
    // Verificar se temos produtos para mostrar
    if (produtos.length === 0) return;
    
    const nome = nomesFalsos[Math.floor(Math.random() * nomesFalsos.length)];
    const produto = produtos[Math.floor(Math.random() * produtos.length)];
    const { horario, timeAgo } = gerarHorarioAleatorio();

    setNotificacao({
      visivel: true,
      nome,
      produto,
      horario,
      timeAgo
    });

    // Esconder a notificação após 7 segundos
    setTimeout(() => {
      setNotificacao(prev => ({ ...prev, visivel: false }));
    }, 7000);
  };

  useEffect(() => {
    // Iniciar o ciclo de notificações após produtos serem carregados
    if (produtos.length === 0) return;
    
    // Mostrar a primeira notificação após um delay inicial
    const delayInicial = setTimeout(() => {
      gerarNovaNotificacao();
      
      // Configurar o intervalo para mostrar novas notificações a cada 15 segundos fixos
      const intervalo = setInterval(() => {
        gerarNovaNotificacao();
      }, 15000); // Exatamente 15 segundos
      
      return () => clearInterval(intervalo);
    }, 5000);
    
    return () => clearTimeout(delayInicial);
  }, [produtos]);

  return (
    <AnimatePresence>
      {notificacao.visivel && notificacao.produto && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-4 left-4 z-50 bg-gradient-to-br from-dark-200/80 to-dark-300/80 backdrop-blur-md border border-primary/10 shadow-xl rounded-lg overflow-hidden max-w-xs"
        >
          <div className="flex items-center p-3 gap-3">
            {/* Imagem do produto */}
            <div className="relative h-16 w-16 rounded-md overflow-hidden border border-dark-400 shadow-inner">
              <Image 
                src={notificacao.produto.images[0] || '/images/products/product1.png'} 
                alt={notificacao.produto.name}
                className="object-cover" 
                width={100}
                height={100}
                style={{width: '100%', height: '100%'}}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Detalhes */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                <p className="text-green-400 text-xs font-medium">
                  Nova compra • {notificacao.timeAgo} atrás
                </p>
              </div>
              <h4 className="text-white font-medium text-sm line-clamp-1 mb-0.5">
                {notificacao.produto.name}
              </h4>
              <p className="text-gray-300 text-xs">
                Comprado por {notificacao.nome}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesNotification; 