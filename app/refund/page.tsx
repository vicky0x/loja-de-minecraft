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
                      1. Natureza dos Produtos
                    </h2>
                    <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                      Todos os produtos vendidos pela Fantasy Store são digitais, pessoais e de uso imediato. Por se tratarem de itens virtuais entregues automaticamente, não são elegíveis para devolução após ativação ou uso, o que torna o reembolso extremamente limitado e condicionado a regras específicas.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      2. Situações em que o reembolso é permitido
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>A Fantasy Store somente realiza reembolso nos seguintes casos:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Produto não entregue: quando, por falha da loja, o cliente não recebeu nenhum tipo de acesso no prazo máximo de 24 horas após a confirmação do pagamento;</li>
                        <li>Código de acesso/recuperação não utilizado: se o cliente ainda não utilizou o código de ativação, login ou recuperação e notificar a loja dentro de 24 horas após o recebimento.</li>
                      </ul>
                      <p className="font-semibold">Atenção: após o uso ou ativação de qualquer dado de acesso, nenhum tipo de reembolso será processado, sob qualquer justificativa.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      3. Situações em que o reembolso não é permitido
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Não realizamos reembolsos nas seguintes situações:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Quando o código ou conta já foi acessado ou ativado pelo cliente;</li>
                        <li>Se a conta foi compartilhada, modificada ou manuseada incorretamente pelo comprador;</li>
                        <li>Em casos de bloqueio ou suspensão pela Microsoft, exceto nos critérios previstos na cláusula 4;</li>
                        <li>Quando o cliente violou as regras do jogo ou servidor (ex: uso de cheats, hacks, spam, bots etc.);</li>
                        <li>Quando a solicitação ocorrer fora do prazo de garantia (30 dias, ou até 365 dias com extensão paga);</li>
                      </ul>
                      <p>Quando o produto está funcionando corretamente, mesmo que o cliente alegue:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Não saber usar;</li>
                        <li>Não gostar;</li>
                        <li>Ter se arrependido após o uso.</li>
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
                      4. Conta bloqueada pela Microsoft
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Se a conta adquirida for bloqueada pela Microsoft, não realizamos reembolso monetário em nenhuma circunstância.</p>
                      <p>A troca será considerada apenas se:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>O cliente estiver dentro do prazo de garantia;</li>
                        <li>Houver prova clara de que o bloqueio não foi causado por ação do cliente;</li>
                        <li>O cliente não tiver alterado os dados de acesso sem autorização;</li>
                        <li>O histórico da conta e a conduta do usuário forem compatíveis com uso legítimo.</li>
                      </ul>
                      <p>Casos suspeitos ou com provas insuficientes serão recusados.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      5. Responsabilidade do Cliente
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>O cliente é plenamente responsável por:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Ler a descrição do produto antes da compra;</li>
                        <li>Utilizar a conta de maneira individual, segura e responsável;</li>
                        <li>Não realizar modificações ou ações que comprometam a integridade da conta;</li>
                        <li>Agir dentro das regras da Mojang/Microsoft e dos servidores utilizados.</li>
                      </ul>
                      <p>Tentativas de obter reembolso de forma indevida poderão resultar em banimento da loja e ações legais.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      6. Contestação de Pagamento (Chargeback)
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Qualquer tentativa de contestação de pagamento (chargeback), sem justificativa legal válida e sem contato prévio com nossa equipe de suporte, será considerada má-fé, fraude contra o comércio digital e uma violação direta desta política.</p>
                      <p>A Fantasy Store adotará todas as medidas cabíveis dentro da lei para proteger seus direitos e sua integridade financeira, incluindo, mas não se limitando a:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Apresentação de provas detalhadas da entrega e uso do produto;</li>
                        <li>Bloqueio imediato e permanente da conta do cliente na loja;</li>
                        <li>Proibição total de novas compras;</li>
                        <li>Registro da tentativa de fraude em sistemas de proteção ao lojista e bancos parceiros;</li>
                        <li>Ações legais cíveis ou criminais, conforme a gravidade do caso.</li>
                      </ul>
                      <p>Além disso, a loja reserva-se o direito de utilizar os dados fornecidos pelo cliente no ato da compra (como nome, CPF, endereço de IP, e-mail e demais informações) para fins de proteção judicial, defesa comercial e comunicação com gateways de pagamento, instituições financeiras e autoridades competentes.</p>
                      <p>Ao comprar em nosso site, o cliente aceita integralmente esta cláusula e concorda com o uso de seus dados para defesa contra fraudes e abusos, conforme previsto na LGPD e nas normas do comércio eletrônico.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 rounded-xl p-6 shadow-sm border border-dark-300/30 hover:border-primary/30 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center group-hover:text-primary/90 transition-colors duration-300">
                      <span className="text-primary mr-3 bg-primary/10 p-2 rounded-lg">
                        <FaMoneyBillWave className="group-hover:scale-110 transition-transform duration-300" />
                      </span>
                      7. Garantia
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>Toda conta possui garantia padrão de 30 dias.</p>
                      <p>O cliente pode adquirir uma extensão de garantia de até 365 dias mediante pagamento adicional no ato da compra.</p>
                      <p>A garantia cobre problemas técnicos reais, como:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Login inválido;</li>
                        <li>Conta inacessível;</li>
                        <li>Erros diretamente causados pela loja.</li>
                      </ul>
                      <p>A garantia não cobre ações do cliente, como:</p>
                      <ul className="list-disc pl-6 space-y-2 ml-2">
                        <li>Trocas de e-mail ou senha fora das instruções;</li>
                        <li>Banimentos por uso indevido;</li>
                        <li>Compartilhamento da conta;</li>
                        <li>Negligência no manuseio dos dados.</li>
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
                      8. Contato
                    </h2>
                    <div className="text-slate-300 leading-relaxed pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300 space-y-4">
                      <p>
                        Todas as solicitações relacionadas a reembolsos ou garantias devem ser feitas exclusivamente através do e-mail:
                        <a href="mailto:help@fantasystore.com" className="text-primary hover:text-primary-light hover:underline transition-all duration-300 block mt-2">📩 help@fantasystore.com</a>
                      </p>
                      <p>O atendimento ocorre em dias úteis, dentro do horário comercial. Solicitações fora das diretrizes acima serão recusadas automaticamente.</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Rodapé do documento */}
              <motion.div 
                variants={itemVariants}
                className="mt-16 pt-8 border-t border-dark-300/30 text-center"
              >
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