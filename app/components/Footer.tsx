'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaDiscord, 
  FaInstagram, 
  FaYoutube, 
  FaEnvelope, 
  FaHeadset, 
  FaClock,
  FaChevronRight
} from 'react-icons/fa';
import { SiTrustpilot } from 'react-icons/si';
import FooterCategories from './FooterCategories';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Animações para os elementos
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
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
  
  const socialIconVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.2, 
      transition: { type: "spring", stiffness: 300 }
    }
  };

  return (
    <footer className="bg-gradient-to-b from-dark-100 to-dark-200 pt-16 pb-8 border-t border-dark-300/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Bloco 1 - Sobre */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white text-xl font-bold mb-6 relative inline-block">
              Fantasy Store Minecraft
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              A melhor loja de contas de Minecraft Originais. Oferecemos contas originais e completas com as versões Java e Bedrock Edition com garantia de até 365 dias e entrega imediata.
            </p>
            <div className="flex space-x-5">
              <motion.a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#E1306C]"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                aria-label="Instagram - Fantasy Store Minecraft"
              >
                <span className="block w-6 h-6">
                  <FaInstagram size={24} />
                </span>
              </motion.a>
              <motion.a 
                href="https://discord.gg/2q8QrcuP9v" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#5865F2]"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                aria-label="Discord - Comunidade Minecraft"
              >
                <span className="block w-6 h-6">
                  <FaDiscord size={24} />
                </span>
              </motion.a>
              <motion.a 
                href="https://www.youtube.com/@fantasystoreloja" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#FF0000]"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                aria-label="YouTube - Tutoriais Minecraft"
              >
                <span className="block w-6 h-6">
                  <FaYoutube size={24} />
                </span>
              </motion.a>
              <motion.a 
                href="https://www.trustpilot.com/review/fantasystore.com.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-300 transition-colors hover:text-[#00B67A]"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                aria-label="Avaliações - Loja de Minecraft"
              >
                <span className="block w-6 h-6">
                  <SiTrustpilot size={24} />
                </span>
              </motion.a>
            </div>
          </motion.div>
          
          {/* Bloco 2 - Links Rápidos */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white text-xl font-bold mb-6 relative inline-block">
              Links Rápidos
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li className="group">
                <Link 
                  href="/products" 
                  className="text-slate-300 group-hover:text-primary transition-colors inline-flex items-center"
                >
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-2 w-3 h-3 block">
                    <FaChevronRight size={12} />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Contas de Minecraft</span>
                </Link>
              </li>
              <li className="group">
                <Link 
                  href="/dashboard" 
                  className="text-slate-300 group-hover:text-primary transition-colors inline-flex items-center"
                >
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-2 w-3 h-3 block">
                    <FaChevronRight size={12} />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Minha Conta</span>
                </Link>
              </li>
              <li className="group">
                <Link 
                  href="/cart" 
                  className="text-slate-300 group-hover:text-primary transition-colors inline-flex items-center"
                >
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-2 w-3 h-3 block">
                    <FaChevronRight size={12} />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Carrinho</span>
                </Link>
              </li>
              <li className="group">
                <Link 
                  href="/orders" 
                  className="text-slate-300 group-hover:text-primary transition-colors inline-flex items-center"
                >
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-2 w-3 h-3 block">
                    <FaChevronRight size={12} />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Meus Pedidos</span>
                </Link>
              </li>
            </ul>
          </motion.div>
          
          {/* Bloco 3 - Categorias */}
          <FooterCategories />
          
          {/* Bloco 4 - Contato e Suporte */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white text-xl font-bold mb-6 relative inline-block">
              Contato & Suporte
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <span className="text-primary mt-0.5 w-5 h-5 flex-shrink-0">
                  <FaHeadset size={20} />
                </span>
                <div>
                  <p className="text-white font-medium">Suporte via Chat</p>
                  <p className="text-slate-300 text-sm">Resposta rápida e eficiente</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-primary mt-0.5 w-5 h-5 flex-shrink-0">
                  <FaClock size={20} />
                </span>
                <div>
                  <p className="text-white font-medium">Horário de Atendimento</p>
                  <p className="text-slate-300 text-sm">Segunda a Sexta, 12h às 20h</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-primary mt-0.5 w-5 h-5 flex-shrink-0">
                  <FaEnvelope size={20} />
                </span>
                <div>
                  <p className="text-white font-medium">E-mail de Suporte</p>
                  <a href="mailto:help@fantasystore.com.br" className="text-slate-300 text-sm hover:text-primary transition-colors">
                    help@fantasystore.com.br
                  </a>
                </div>
              </li>
            </ul>
          </motion.div>
        </motion.div>
        
        {/* Copyright */}
        <motion.div 
          className="border-t border-dark-300/10 pt-8 mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ 
            opacity: 1, 
            transition: { 
              delay: 0.5, 
              duration: 0.8 
            } 
          }}
          viewport={{ once: true }}
        >
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ 
              y: 0, 
              opacity: 1, 
              transition: { duration: 0.5 } 
            }}
            viewport={{ once: true }}
            className="text-slate-300 font-light"
          >
            © {currentYear} Fantasy Store - Loja de Contas de Minecraft Originais. Todos os direitos reservados.
          </motion.p>
          
          {/* Texto adicional com palavras-chave relevantes para SEO */}
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ 
              y: 0, 
              opacity: 1, 
              transition: { delay: 0.3, duration: 0.5 } 
            }}
            viewport={{ once: true }}
            className="text-slate-400 text-xs max-w-4xl mx-auto mt-4 px-4"
          >
            Fantasy Store é especializada em venda de contas de Minecraft Original Originais com garantia de até 365 dias. 
            Fornecemos contas de Minecraft Java Edition e Bedrock Edition com entrega automática imediata. 
            Compre Minecraft Original pelo menor preço do Brasil com total segurança. 
            Minecraft é marca registrada da Mojang Studios e Microsoft. Não somos afiliados a Mojang ou Microsoft.
          </motion.p>
          
          <div className="mt-4 flex flex-wrap justify-center gap-5 text-sm">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ 
                opacity: 1, 
                y: 0, 
                transition: { 
                  delay: 0.6, 
                  duration: 0.5 
                } 
              }}
              viewport={{ once: true }}
            >
              <Link 
                href="/terms" 
                className="text-slate-400 hover:text-primary transition-all duration-300 relative group"
              >
                <span>Termos de Uso</span>
                <span className="absolute left-0 right-0 bottom-0 h-px w-0 bg-gradient-to-r from-primary to-primary-light group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>
            <span className="text-slate-600">•</span>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ 
                opacity: 1, 
                y: 0, 
                transition: { 
                  delay: 0.7, 
                  duration: 0.5 
                } 
              }}
              viewport={{ once: true }}
            >
              <Link 
                href="/privacy" 
                className="text-slate-400 hover:text-primary transition-all duration-300 relative group"
              >
                <span>Política de Privacidade</span>
                <span className="absolute left-0 right-0 bottom-0 h-px w-0 bg-gradient-to-r from-primary to-primary-light group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>
            <span className="text-slate-600">•</span>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ 
                opacity: 1, 
                y: 0, 
                transition: { 
                  delay: 0.8, 
                  duration: 0.5 
                } 
              }}
              viewport={{ once: true }}
            >
              <Link 
                href="/refund" 
                className="text-slate-400 hover:text-primary transition-all duration-300 relative group"
              >
                <span>Política de Reembolso</span>
                <span className="absolute left-0 right-0 bottom-0 h-px w-0 bg-gradient-to-r from-primary to-primary-light group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
} 