'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth as useAuthContext } from '@/app/contexts/AuthContext';

export default function AuthNav() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const { logout, user } = useAuthContext();

  useEffect(() => {
    // Definir o estado de autenticação com base no usuário do contexto
    setIsAuthenticated(!!user);
    setIsLoading(false);
    
    // Adicionar listener para eventos de autenticação
    const handleAuthChanged = () => {
      console.log('Auth state changed event captured in AuthNav');
      setIsAuthenticated(!!user);
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowMenu(false);
      router.refresh();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Falha ao fazer logout');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-24 bg-dark-300 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isAuthenticated ? (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-2 text-white hover:text-primary transition-colors"
          >
            <FiUser className="h-5 w-5" />
            <span>Minha Conta</span>
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-dark-200 border border-dark-300 rounded-xl shadow-lg py-2 z-50"
              >
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-white hover:bg-dark-300 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="block px-4 py-2 text-white hover:bg-dark-300 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Meus Pedidos
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-white hover:bg-dark-300 transition-colors flex items-center space-x-2"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <Link
            href="/auth/login"
            className="text-white hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Cadastrar
          </Link>
        </div>
      )}
    </div>
  );
} 