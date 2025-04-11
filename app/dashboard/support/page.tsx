'use client';

import React, { useEffect, useState } from 'react';
import { 
  FiMessageCircle, 
  FiMail, 
  FiClock, 
  FiCalendar, 
  FiUser, 
  FiAlertCircle,
  FiBell,
  FiPhone,
  FiMessageSquare,
  FiHelpCircle
} from 'react-icons/fi';
import { 
  FaTelegram, 
  FaDiscord 
} from 'react-icons/fa';

// Declaração de tipos para o JivoChat
declare global {
  interface Window {
    jivo_api?: {
      open: () => void;
    };
  }
}

export default function SupportPage() {
  const [jivoAvailable, setJivoAvailable] = useState(false);

  // Verificar periodicamente se o Jivo API está disponível
  useEffect(() => {
    // Função para verificar disponibilidade do JivoChat
    const checkJivoAvailability = () => {
      if (window.jivo_api) {
        setJivoAvailable(true);
        console.log("JivoChat API disponível");
        return true;
      }
      return false;
    };

    // Verificar imediatamente
    const isAvailable = checkJivoAvailability();
    
    // Se não estiver disponível, configurar um intervalo para verificar periodicamente
    let intervalId: NodeJS.Timeout;
    if (!isAvailable) {
      intervalId = setInterval(() => {
        if (checkJivoAvailability()) {
          clearInterval(intervalId);
        }
      }, 2000); // Verificar a cada 2 segundos
    }

    // Limpar intervalo quando o componente for desmontado
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Central de Suporte</h1>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg flex items-center">
          <FiAlertCircle className="mr-2" />
          <span>Tempo médio de resposta: 10 minutos</span>
        </div>
      </div>

      {/* Introdução */}
      <div className="bg-dark-200 rounded-lg p-6 mb-8 shadow-lg border border-dark-300">
        <h2 className="text-xl font-semibold mb-4 text-white">Bem-vindo à Central de Suporte</h2>
        <p className="text-gray-300 mb-4">
          Nossa equipe está disponível para ajudar você com qualquer dúvida, problema ou sugestão.
          Escolha abaixo o canal de atendimento que preferir.
        </p>
        <div className="flex items-center text-primary">
          <FiBell className="mr-2" />
          <p className="text-sm font-medium">
            Respondemos a maioria das solicitações em até 10 minutos durante o horário de atendimento.
          </p>
        </div>
      </div>

      {/* Aviso Importante */}
      <div className="bg-primary/10 rounded-lg p-6 mb-8 shadow-lg border border-primary/20">
        <h2 className="text-xl font-semibold mb-4 text-primary flex items-center">
          <FiAlertCircle className="mr-2" />
          Aviso Importante
        </h2>
        <p className="text-gray-300 mb-4">
          Ao entrar em contato com o suporte através de qualquer canal disponível, é necessário que você forneça as seguintes informações:
        </p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li><strong>Problemas com produtos:</strong> Forneça os dados do pedido (número, data e produto específico) e descreva detalhadamente o problema que está enfrentando.</li>
          <li><strong>Dúvidas gerais:</strong> Apresente sua dúvida de forma clara logo ao iniciar o atendimento.</li>
        </ul>
        <p className="text-primary text-sm font-medium">
          Fornecer essas informações reduz significativamente o tempo de resposta e facilita que nossa equipe possa ajudá-lo(a) com mais eficiência.
        </p>
      </div>

      {/* Canais de Atendimento */}
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FiHelpCircle className="mr-2" />
        Canais de Atendimento
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Chat Online */}
        <div className="bg-dark-200 rounded-lg p-6 border-l-4 border-green-500 shadow-lg hover:transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
              <FiMessageCircle size={24} />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Chat Online</h3>
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span className="text-green-500 text-sm font-medium">Disponível</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 mb-3 text-sm">
            Suporte em tempo real para atendimento rápido e eficiente.
          </p>
          <div className="mt-3 text-sm text-gray-400">
            <span className="flex items-center mb-1">
              <FiUser className="mr-2" /> Atendentes online
            </span>
            <span className="flex items-center">
              <FiClock className="mr-2" /> Resposta imediata
            </span>
          </div>
          <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
            onClick={() => {
              if (window.jivo_api) {
                window.jivo_api.open();
              } else {
                // Fallback se o Jivo não estiver carregado
                alert('O chat está carregando. Por favor, tente novamente em alguns segundos.');
              }
            }}
          >
            <div className="flex items-center justify-center">
              {jivoAvailable ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  <span>Iniciar Chat</span>
                </>
              ) : (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Carregando Chat...</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Telegram */}
        <div className="bg-dark-200 rounded-lg p-6 border-l-4 border-red-500 shadow-lg hover:transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <FaTelegram size={24} />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Telegram</h3>
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                <span className="text-red-500 text-sm font-medium">Indisponível</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 mb-3 text-sm">
            Nosso canal oficial no Telegram está temporariamente em manutenção.
          </p>
          <div className="mt-3 text-sm text-gray-400">
            <span className="flex items-center mb-1">
              <FiAlertCircle className="mr-2" /> Em manutenção
            </span>
            <span className="flex items-center">
              <FiClock className="mr-2" /> Retorno em breve
            </span>
          </div>
          <button disabled className="mt-4 w-full bg-gray-600 cursor-not-allowed text-gray-300 py-2 px-4 rounded opacity-70">
            Indisponível
          </button>
        </div>

        {/* Email */}
        <div className="bg-dark-200 rounded-lg p-6 border-l-4 border-yellow-500 shadow-lg hover:transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <FiMail size={24} />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Email</h3>
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                <span className="text-yellow-500 text-sm font-medium">Disponível</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 mb-3 text-sm">
            Envie sua mensagem para nossa equipe de suporte por email.
          </p>
          <div className="mt-3 text-sm text-gray-400">
            <span className="flex items-center mb-1">
              <FiMail className="mr-2" /> help@fantasystore.com.br
            </span>
            <span className="flex items-center">
              <FiClock className="mr-2" /> Resposta em até 30 min
            </span>
          </div>
          <a href="mailto:help@fantasystore.com.br" className="mt-4 block w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded text-center transition-colors">
            Enviar Email
          </a>
        </div>

        {/* Discord */}
        <div className="bg-dark-200 rounded-lg p-6 border-l-4 border-purple-500 shadow-lg hover:transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
              <FaDiscord size={24} />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Discord</h3>
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                <span className="text-red-500 text-sm font-medium">Indisponível</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 mb-3 text-sm">
            Nosso servidor no Discord está temporariamente indisponível.
          </p>
          <div className="mt-3 text-sm text-gray-400">
            <span className="flex items-center mb-1">
              <FiAlertCircle className="mr-2" /> Em manutenção
            </span>
            <span className="flex items-center">
              <FiClock className="mr-2" /> Retorno em breve
            </span>
          </div>
          <button disabled className="mt-4 w-full bg-gray-600 cursor-not-allowed text-gray-300 py-2 px-4 rounded opacity-70">
            Indisponível
          </button>
        </div>
      </div>

      {/* Horários de Atendimento */}
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FiClock className="mr-2" />
        Horários de Atendimento
      </h2>
      
      <div className="bg-dark-200 rounded-lg shadow-lg overflow-hidden mb-10">
        <div className="p-6 border-b border-dark-300">
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <FiCalendar className="mr-2 text-primary" />
            Expediente Normal
          </h3>
          <p className="text-gray-300 mb-4">
            Nossa equipe está disponível para atendimento nos seguintes horários:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2">Segunda à Sábado</h4>
              <div className="flex items-center">
                <FiClock className="mr-2 text-gray-400" />
                <span>12:00 às 20:00</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Atendimento completo em todos os canais
              </p>
            </div>
            
            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="font-medium text-yellow-500 mb-2">Domingos e Feriados</h4>
              <div className="flex items-center">
                <FiClock className="mr-2 text-gray-400" />
                <span>12:00 às 16:00</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Atendimento reduzido (Apenas Chat)
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FiPhone className="mr-2 text-primary" />
            Tempos de Resposta
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-dark-400">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mr-3">
                  <FiMessageCircle size={18} />
                </div>
                <span>Chat Online</span>
              </div>
              <span className="text-green-500">Imediato</span>
            </div>
            
            <div className="flex items-center justify-between pb-2 border-b border-dark-400">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mr-3">
                  <FaTelegram size={18} />
                </div>
                <span>Telegram</span>
              </div>
              <span className="text-red-500">Indisponível</span>
            </div>
            
            <div className="flex items-center justify-between pb-2 border-b border-dark-400">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mr-3">
                  <FiMail size={18} />
                </div>
                <span>Email</span>
              </div>
              <span className="text-yellow-500">Até 30 minutos</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 mr-3">
                  <FaDiscord size={18} />
                </div>
                <span>Discord</span>
              </div>
              <span className="text-red-500">Indisponível</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ ou Perguntas Frequentes */}
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FiHelpCircle className="mr-2" />
        Perguntas Frequentes
      </h2>
      
      <div className="bg-dark-200 rounded-lg p-6 mb-8 shadow-lg">
        <div className="space-y-4">
          <div className="border-b border-dark-300 pb-4">
            <h3 className="font-semibold text-lg mb-2">Qual o tempo de entrega do produto?</h3>
            <p className="text-gray-300">
              A entrega é instantânea caso haja estoque disponível. Caso contrário, o pedido pode ser entregue 
              em até 24h. Você será notificado assim que seu produto estiver disponível para acesso.
            </p>
          </div>
          
          <div className="border-b border-dark-300 pb-4">
            <h3 className="font-semibold text-lg mb-2">Por onde meu produto será entregue?</h3>
            <p className="text-gray-300">
              Todos os produtos são entregues digitalmente através da plataforma. Após a compra, 
              você terá acesso imediato em "Meus Produtos" no seu Dashboard, onde poderá fazer o download 
              ou acessar os links de ativação conforme o tipo de produto adquirido.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Os produtos do site têm garantia?</h3>
            <p className="text-gray-300">
              Sim, todos os nossos produtos possuem garantia padrão de 30 dias. Esta garantia pode ser estendida
              mediante pagamento adicional. Detalhes específicos sobre extensão de garantia estão disponíveis 
              na página do produto e nos termos de uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 