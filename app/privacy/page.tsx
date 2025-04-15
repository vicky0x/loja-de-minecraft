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
              A Fantasy Store respeita sua privacidade e está comprometida em proteger os dados pessoais dos usuários que acessam e utilizam nosso site. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações.
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
                      1. Informações Coletadas
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Ao utilizar o site fantasystore.com.br, poderemos coletar as seguintes informações:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Dados fornecidos pelo usuário: nome de usuário, e-mail, endereço IP, avaliações, dados de pagamento e outras informações inseridas voluntariamente no site;</li>
                        <li>Informações de navegação: páginas acessadas, tempo de permanência, dispositivo utilizado, sistema operacional e navegador;</li>
                        <li>Cookies e tecnologias similares: usamos cookies para melhorar a experiência do usuário, lembrar preferências e medir desempenho do site.</li>
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
                      2. Uso das Informações
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Os dados coletados são utilizados para os seguintes fins:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Processar pedidos e entregas de produtos;</li>
                        <li>Garantir a segurança das transações;</li>
                        <li>Oferecer suporte ao cliente;</li>
                        <li>Enviar notificações importantes sobre pedidos ou atualizações de serviço;</li>
                        <li>Prevenir fraudes, abusos e acessos não autorizados;</li>
                        <li>Cumprir obrigações legais.</li>
                      </ul>
                      <p className="mt-4">Não vendemos, alugamos ou compartilhamos suas informações com terceiros para fins comerciais.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      3. Armazenamento e Segurança
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Seus dados são armazenados de forma segura em servidores protegidos por criptografia, autenticação e monitoramento.
                      </p>
                      <p>
                        Empregamos medidas técnicas e organizacionais rigorosas para proteger seus dados contra perda, uso indevido ou acesso não autorizado.
                      </p>
                      <p>
                        Apenas pessoal autorizado tem acesso às informações pessoais fornecidas.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      4. Compartilhamento com Terceiros
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Podemos compartilhar dados com terceiros apenas quando:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Necessário para processar pagamentos ou entregar produtos;</li>
                        <li>Exigido por lei, decisão judicial ou solicitação governamental;</li>
                        <li>For essencial para investigar fraudes, abusos ou violações aos nossos termos.</li>
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
                      5. Direitos do Usuário
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Você tem o direito de:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Acessar e revisar suas informações pessoais armazenadas;</li>
                        <li>Corrigir dados incorretos;</li>
                        <li>Solicitar a exclusão de seus dados (exceto quando houver obrigações legais que exijam retenção);</li>
                        <li>Solicitar informações sobre como seus dados estão sendo utilizados.</li>
                      </ul>
                      <p className="mt-4">Para exercer seus direitos, entre em contato através do e-mail: <a href="mailto:help@fantasystore.com" className="text-primary hover:text-primary-light hover:underline transition-all duration-300">help@fantasystore.com</a></p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      6. Cookies
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Utilizamos cookies essenciais para o funcionamento do site e cookies de desempenho para analisar métricas de uso.
                      </p>
                      <p>
                        O usuário pode configurar seu navegador para recusar cookies, mas isso poderá afetar a funcionalidade do site.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      7. Alterações na Política de Privacidade
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      A Fantasy Store se reserva o direito de modificar esta política a qualquer momento, sem aviso prévio. As alterações entrarão em vigor imediatamente após a publicação no site. Recomendamos a leitura periódica desta página.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      8. Contato
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Para mais informações ou dúvidas sobre esta Política de Privacidade, entre em contato conosco:
                      <a href="mailto:help@fantasystore.com" className="text-primary hover:text-primary-light hover:underline transition-all duration-300 block mt-2">📩 help@fantasystore.com</a>
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