'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { name: 'Início', href: '/' },
    { name: 'Produtos', href: '/products' },
    { name: 'Como Funciona', href: '/how-it-works' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contato', href: '/contact' },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark-200/95 backdrop-blur-sm py-2 shadow-md' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-primary font-bold text-xl md:text-2xl">Fantasy Store</span>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`font-medium hover:text-primary transition-colors ${
                  pathname === item.href ? 'text-primary' : 'text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Botões de Ação */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/auth/login" 
              className="relative overflow-hidden group px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
            >
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
              <span className="relative z-10">Login</span>
            </Link>
            <Link 
              href="/auth/register" 
              className="relative overflow-hidden group px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
            >
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-primary group-hover:bg-primary-light"></span>
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-primary-dark opacity-70 group-hover:bg-transparent group-hover:skew-x-6"></span>
              <span className="relative z-10">Cadastrar</span>
            </Link>
          </div>

          {/* Botão Menu Mobile */}
          <button 
            className="md:hidden text-white p-2"
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      <div 
        className={`md:hidden bg-dark-300 ${
          isMenuOpen ? 'max-h-96 py-4' : 'max-h-0 py-0'
        } overflow-hidden transition-all duration-300`}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={`font-medium hover:text-primary transition-colors ${
                pathname === item.href ? 'text-primary' : 'text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="flex flex-col space-y-2 pt-2">
            <Link 
              href="/auth/login" 
              className="relative overflow-hidden group py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 text-center"
            >
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
              <span className="relative z-10">Login</span>
            </Link>
            <Link 
              href="/auth/register" 
              className="relative overflow-hidden group py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 text-center"
            >
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-primary group-hover:bg-primary-light"></span>
              <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-primary-dark opacity-70 group-hover:bg-transparent group-hover:skew-x-6"></span>
              <span className="relative z-10">Cadastrar</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 