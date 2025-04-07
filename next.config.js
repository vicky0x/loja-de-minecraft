/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**',
      },
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'fantasystore.com.br',
        port: '',
        pathname: '/api/images/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development', // Otimizar imagens em produção
  },
  // Definir porta fixa
  serverRuntimeConfig: {
    port: process.env.PORT || 3000
  },
  // Configuração para limitar os logs apenas a erros
  logging: {
    fetches: {
      fullUrl: true,
    },
    level: process.env.NODE_ENV === 'production' ? 'error' : 'info'
  },
  // Otimizações para produção
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  poweredByHeader: false, // Remover cabeçalho X-Powered-By por segurança
};

module.exports = nextConfig; 