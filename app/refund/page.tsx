'use client';

import { motion } from 'framer-motion';
import { FaMoneyBillWave } from 'react-icons/fa';
import Link from 'next/link';
import React from 'react';

export default function RefundPage() {
  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100,
        duration: 0.5
      }
    }
  };

  return (
    <div className="bg-dark-100 min-h-screen">
      {/* Hero Section - Design aprimorado */}
      <div className="bg-gradient-to-br from-dark-200 via-dark-200/90 to-dark-100 border-b border-dark-300/30">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-300 mb-6">
              Política de Reembolso
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Entenda nossas condições para devolução de valores e reembolsos.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Conteúdo Principal - Design aprimorado */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <motion.div 
          className="max-w-4xl mx-auto bg-gradient-to-b from-dark-200/80 to-dark-200/60 backdrop-blur-md rounded-2xl border border-dark-300/40 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="p-1">
            <div className="bg-dark-300/10 rounded-xl p-6 md:p-10">
              {/* Seções de conteúdo */}
              <div className="space-y-12">
                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      1. Elegibilidade para Reembolso
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        A Fantasy Store oferece reembolsos em circunstâncias específicas, considerando a natureza digital dos produtos vendidos. Produtos digitais podem ser elegíveis para reembolso dentro de 24 horas após a compra se:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>O produto apresentar defeitos técnicos significativos que impeçam seu funcionamento adequado;</li>
                        <li>O produto não for compatível com o sistema indicado, apesar de seguir todos os requisitos listados;</li>
                        <li>A compra foi realizada por engano ou erro (sujeito à avaliação).</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      2. Casos Não Elegíveis para Reembolso
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Não oferecemos reembolso nos seguintes casos:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Compras realizadas há mais de 24 horas;</li>
                        <li>Produtos que já foram baixados e/ou utilizados;</li>
                        <li>Cliente insatisfeito com as funcionalidades do produto, mesmo que funcionando conforme descrito;</li>
                        <li>Cliente banido ou penalizado por desenvolvedores de jogos devido ao uso do produto;</li>
                        <li>Incompatibilidade com sistemas não listados como suportados.</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      3. Processo de Solicitação
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Para solicitar um reembolso, siga estes passos:</p>
                      <ol className="list-decimal pl-6 space-y-2 ml-2">
                        <li>Acesse sua conta na Fantasy Store;</li>
                        <li>Vá para a seção "Meus Pedidos";</li>
                        <li>Localize a compra para a qual deseja solicitar reembolso;</li>
                        <li>Clique em "Solicitar Reembolso";</li>
                        <li>Forneça uma explicação detalhada do motivo da solicitação;</li>
                        <li>Envie evidências que suportem sua solicitação (screenshots, logs de erro, etc.).</li>
                      </ol>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      4. Tempos de Processamento
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      As solicitações de reembolso são analisadas em até 3 dias úteis. Após a aprovação, o valor será reembolsado usando o mesmo método de pagamento da compra original. O tempo para o valor aparecer em sua conta depende da sua instituição financeira e pode levar de 5 a 10 dias úteis.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      5. Cancelamentos de Assinaturas
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Assinaturas e planos recorrentes podem ser cancelados a qualquer momento através de sua conta. O cancelamento entrará em vigor no final do período de faturamento atual. Não oferecemos reembolsos parciais para períodos não utilizados de assinaturas canceladas.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      6. Casos Especiais
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Em casos de cobranças duplicadas ou erros no processamento de pagamento, entre em contato imediatamente com nossa equipe de suporte. Estes casos serão tratados com prioridade e, se confirmados, o reembolso será processado em até 48 horas.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      7. Contato para Suporte
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Para questões específicas sobre reembolsos ou para situações não cobertas por esta política, entre em contato com nossa equipe de suporte através do email: <a href="mailto:refunds@fantasystore.com.br" className="text-primary hover:text-primary-light hover:underline transition-all duration-300">refunds@fantasystore.com.br</a>.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Rodapé do documento */}
              <motion.div 
                variants={itemVariants}
                className="mt-16 pt-8 border-t border-dark-300/30 text-center"
              >
                <p className="text-slate-400 mb-4">
                  Última atualização: {new Date().toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <Link 
                  href="/"
                  className="inline-block px-8 py-3.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 font-medium"
                >
                  Voltar para a Página Inicial
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 