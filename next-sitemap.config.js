/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br',
  generateRobotsTxt: false, // Já temos um arquivo robots.txt personalizado
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin',
    '/dashboard',
    '/auth/reset-password',
    '/api/*',
    '/checkout/*',
    '/404',
    '/500',
  ],
  alternateRefs: [
    {
      href: process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br',
      hreflang: 'pt-BR',
    },
  ],
  transform: async (config, path) => {
    // Configurações personalizadas por caminho
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      }
    }
    // Produtos - prioridade alta
    if (path.startsWith('/product/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      }
    }
    // Categorias - prioridade média-alta
    if (path.startsWith('/products/category/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      }
    }
    // Retornar valores padrão para outras páginas
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    }
  },
} 