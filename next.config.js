/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    domains: ['media.minecraftloja.com.br', 'storage.googleapis.com', 'localhost'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
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
  // Comprimir componentes para melhor desempenho
  compress: true,
  // Otimização experimental
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Manter apenas CSS crítico na primeira carga
    optimizeServerReact: true,
  },
  // Adicionar headers para segurança e otimização
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=31536000',
          },
        ],
      },
    ];
  },
  // Configuração de webpack para melhor otimização
  webpack: (config, { dev, isServer }) => {
    // Otimizar apenas em produção
    if (!dev) {
      // Otimização do tamanho do bundle
      config.optimization.minimize = true;
      
      // Adicionar análise de bundle se ANALYZE estiver definido
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
    }
    
    // Resolver problemas com módulos específicos no lado do cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        'mock-aws-s3': false, 
        'aws-sdk': false,
        'nock': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 