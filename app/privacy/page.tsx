'use client';

import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';
import Link from 'next/link';
import React from 'react';

export default function PrivacyPage() {
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
              Política de Privacidade
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Como protegemos suas informações pessoais e respeitamos sua privacidade.
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
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      1. Introdução
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      A Fantasy Store valoriza a sua privacidade e está comprometida em proteger suas informações pessoais. Esta Política de Privacidade descreve como coletamos, usamos e compartilhamos suas informações quando você utiliza nosso site, produtos e serviços.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      2. Informações que Coletamos
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Podemos coletar os seguintes tipos de informações:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Informações de contato (como nome, endereço de e-mail);</li>
                        <li>Informações de conta (nome de usuário, senha);</li>
                        <li>Informações de transações (detalhes de compras, métodos de pagamento);</li>
                        <li>Informações técnicas (endereço IP, cookies, dados de navegação).</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      3. Como Usamos Suas Informações
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Utilizamos suas informações para:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Fornecer e manter nossos serviços;</li>
                        <li>Processar e completar suas transações;</li>
                        <li>Enviar informações administrativas;</li>
                        <li>Melhorar nossos serviços e conteúdo;</li>
                        <li>Personalizar sua experiência;</li>
                        <li>Prevenir atividades fraudulentas.</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      4. Compartilhamento de Informações
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Podemos compartilhar suas informações com:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Provedores de serviços de pagamento para processar transações;</li>
                        <li>Prestadores de serviços que nos ajudam a operar nosso site;</li>
                        <li>Autoridades legais quando exigido por lei.</li>
                      </ul>
                      <p className="mt-4">Nunca vendemos suas informações pessoais a terceiros.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      5. Segurança de Dados
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela internet ou método de armazenamento eletrônico é 100% seguro.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      6. Seus Direitos
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Dependendo da sua localização, você pode ter os seguintes direitos em relação aos seus dados pessoais:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Acessar os dados pessoais que mantemos sobre você;</li>
                        <li>Corrigir dados incompletos ou imprecisos;</li>
                        <li>Solicitar a exclusão de seus dados pessoais;</li>
                        <li>Restringir ou se opor ao processamento de seus dados;</li>
                        <li>Solicitar a transferência de seus dados para outro controlador;</li>
                        <li>Retirar seu consentimento a qualquer momento.</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      7. Cookies e Tecnologias Semelhantes
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, analisar como você usa nossos serviços e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      8. Alterações nesta Política
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre quaisquer alterações materiais publicando a nova política em nosso site e, quando apropriado, através de e-mail.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      9. Contato
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Se você tiver dúvidas sobre esta Política de Privacidade, por favor, entre em contato conosco através do email: <a href="mailto:privacy@fantasystore.com.br" className="text-primary hover:text-primary-light hover:underline transition-all duration-300">privacy@fantasystore.com.br</a>.
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