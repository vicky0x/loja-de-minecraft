'use client';

import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import React from 'react';

export default function TermsPage() {
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
              Termos de Uso
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Leia atentamente os termos e condições para o uso dos serviços oferecidos pela Fantasy Store.
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
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      1. Aceitação dos Termos
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Ao acessar e utilizar os serviços da Fantasy Store, você concorda com os presentes Termos de Uso e com todas as diretrizes e políticas aplicáveis, incluindo nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos, por favor, não utilize nossos serviços.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      2. Descrição dos Serviços
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        A Fantasy Store oferece produtos digitais, especificamente software para uso em jogos eletrônicos. Nossos produtos são destinados apenas para uso em jogos que permitem tais modificações e onde o uso não viola os termos de serviço do jogo.
                      </p>
                      <p>
                        Não nos responsabilizamos pelo uso inadequado de nossos produtos ou por quaisquer penalidades aplicadas por desenvolvedores ou publicadores de jogos como resultado do uso de nossos produtos.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      3. Contas de Usuário
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Para acessar determinados recursos da plataforma, você precisará criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades que ocorrem sob sua conta. Você concorda em notificar imediatamente a Fantasy Store sobre qualquer uso não autorizado de sua conta.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      4. Propriedade Intelectual
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Todo o conteúdo disponível através de nossos serviços, incluindo mas não limitado a textos, gráficos, logotipos, ícones, imagens, arquivos de áudio e software, é propriedade da Fantasy Store ou de seus licenciadores e é protegido por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      5. Pagamentos e Reembolsos
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Todos os pagamentos são processados através de sistemas de pagamento seguros. Os preços estão sujeitos a alterações sem aviso prévio.
                      </p>
                      <p>
                        Nossa política de reembolso está detalhada em nossa <Link href="/refund" className="text-primary hover:text-primary-light hover:underline transition-all duration-300">Política de Reembolso</Link>. De modo geral, devido à natureza digital de nossos produtos, reembolsos são concedidos apenas em circunstâncias específicas.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      6. Limitação de Responsabilidade
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      A Fantasy Store não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar nossos serviços. Isto inclui, sem limitação, danos por perda de lucros, boa vontade, uso, dados ou outras perdas intangíveis.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      7. Modificações dos Termos
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      A Fantasy Store reserva-se o direito de modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor após a publicação dos termos atualizados. O uso contínuo dos serviços após tais alterações constitui sua aceitação dos novos termos.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      8. Contato
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Se você tiver dúvidas sobre estes Termos de Uso, por favor, entre em contato conosco através do email: <a href="mailto:help@fantasystore.com.br" className="text-primary hover:text-primary-light hover:underline transition-all duration-300">help@fantasystore.com.br</a>.
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