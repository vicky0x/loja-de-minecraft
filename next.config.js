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
    ],
    unoptimized: true, // Para facilitar o uso com as imagens da API
  },
  // Definir porta fixa
  serverRuntimeConfig: {
    port: 3000
  },
  // Configuração para limitar os logs apenas a erros
  logging: {
    fetches: {
      fullUrl: true,
    },
    level: 'error'
  },
};

module.exports = nextConfig; 