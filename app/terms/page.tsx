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
              Bem-vindo à Fantasy Store. Ao acessar ou utilizar este site, você concorda em cumprir e se sujeitar aos presentes Termos de Uso, bem como à nossa Política de Privacidade. Caso não concorde com qualquer cláusula, não utilize este site.
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
                      Ao utilizar o site fantasystore.com.br, você declara ter lido, compreendido e aceitado integralmente estes termos. O uso do site implica em concordância expressa com todas as disposições aqui previstas.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      2. Elegibilidade
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Nosso serviço está disponível apenas para pessoas com 18 anos ou mais. Menores de idade devem utilizar o site com supervisão de um responsável legal. Ao criar uma conta, você declara ser legalmente capaz e responsável pelas informações fornecidas.
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
                      3. Cadastro de Usuário
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Você deve fornecer informações verdadeiras, completas e atualizadas ao se registrar.
                      </p>
                      <p>
                        É proibido compartilhar sua conta com terceiros.
                      </p>
                      <p>
                        A Fantasy Store não se responsabiliza por acessos indevidos decorrentes de negligência no armazenamento de dados de login.
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
                      4. Produtos e Serviços
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        A Fantasy Store comercializa contas de Minecraft, podendo incluir contas originais, alternadas (alts) ou contas com recursos específicos.
                      </p>
                      <p>
                        Todos os produtos são digitais e entregues via plataforma, após confirmação de pagamento.
                      </p>
                      <p>
                        A Fantasy Store não é afiliada à Mojang ou Microsoft. Somos uma loja independente de revenda de contas.
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
                      5. Garantia
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Todas as contas vendidas pela Fantasy Store incluem uma garantia padrão de 30 dias, válida a partir da data da entrega.
                      </p>
                      <p>
                        O cliente pode optar por garantia estendida, com validade de até 365 dias, mediante pagamento adicional, disponível na página do produto ou no checkout.
                      </p>
                      <p>
                        A garantia cobre exclusivamente falhas relacionadas ao funcionamento da conta, como:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Dados de login inválidos;</li>
                        <li>Conta não acessível no momento da entrega;</li>
                        <li>Informações incorretas fornecidas pela loja.</li>
                      </ul>
                      <p>
                        A garantia não cobre:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Alterações realizadas pelo comprador (ex: troca de senha ou e-mail sem seguir as instruções fornecidas);</li>
                        <li>Suspensões ou banimentos decorrentes de má conduta, uso de cheats ou violação das regras do jogo;</li>
                        <li>Compartilhamento indevido da conta;</li>
                        <li>Perda de acesso por uso irresponsável, vazamento de informações ou descuido do comprador.</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      6. Reembolsos
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Devido à natureza digital e irreversível dos produtos, não oferecemos reembolsos, exceto em casos de entrega comprovadamente incorreta ou produto não funcional dentro do prazo de garantia.
                      </p>
                      <p>
                        Ao comprar na Fantasy Store, você está ciente e concorda que não há direito ao arrependimento após a entrega do produto.
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
                      7. Avaliações e Comentários
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Ao postar uma avaliação, o usuário concorda em manter o respeito, sem linguagem ofensiva, calúnias ou difamações.
                      </p>
                      <p>
                        Reservamo-nos o direito de remover qualquer avaliação ou comentário que viole estas diretrizes, sem aviso prévio.
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
                      8. Propriedade Intelectual
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Todo o conteúdo presente em fantasystore.com.br, incluindo textos, logotipos, imagens e scripts, é de propriedade exclusiva da Fantasy Store. É proibida a reprodução ou uso sem autorização expressa.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      9. Limitação de Responsabilidade
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        A Fantasy Store não se responsabiliza por ações tomadas pelo comprador após a entrega do produto.
                      </p>
                      <p>
                        Não somos responsáveis por suspensões ou banimentos em servidores de terceiros.
                      </p>
                      <p>
                        Ao adquirir um produto, o cliente assume total responsabilidade sobre o uso da conta.
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
                      10. Modificações dos Termos
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      A Fantasy Store poderá alterar estes Termos de Uso a qualquer momento, sem aviso prévio. Recomendamos que os usuários revisem esta página regularmente. O uso contínuo do site após modificações constitui aceitação das mudanças.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaCheckCircle className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      11. Contato
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Para dúvidas, suporte ou solicitações, entre em contato através do e-mail:
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