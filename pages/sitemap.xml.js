import { connectToDatabase } from '@/app/lib/db/mongodb';

// Função para obter a data no formato apropriado para sitemaps
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString();
}

function generateSiteMap(products, categories) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Páginas Fixas -->
     <url>
       <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br'}</loc>
       <lastmod>${formatDate(new Date())}</lastmod>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br'}/products</loc>
       <lastmod>${formatDate(new Date())}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br'}/auth/login</loc>
       <lastmod>${formatDate(new Date())}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br'}/auth/register</loc>
       <lastmod>${formatDate(new Date())}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>

     <!-- Categorias -->
     ${categories
       .map((category) => {
         return `
       <url>
         <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br'}/products/category/${category.slug}</loc>
         <lastmod>${formatDate(category.updatedAt || new Date())}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.7</priority>
       </url>`;
       })
       .join('')}

     <!-- Produtos -->
     ${products
       .map((product) => {
         return `
       <url>
         <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br'}/product/${product.slug}</loc>
         <lastmod>${formatDate(product.updatedAt || new Date())}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.6</priority>
       </url>`;
       })
       .join('')}
   </urlset>
 `;
}

export async function getServerSideProps({ res }) {
  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar todos os produtos publicados e ativos
    const products = await db
      .collection('products')
      .find({ status: { $ne: 'manutencao' } })
      .project({ slug: 1, updatedAt: 1 })
      .toArray();
      
    // Buscar todas as categorias
    const categories = await db
      .collection('categories')
      .find({})
      .project({ slug: 1, updatedAt: 1 })
      .toArray();
    
    // Gerar o XML
    const sitemap = generateSiteMap(products, categories);

    // Definir o cabeçalho
    res.setHeader('Content-Type', 'text/xml');
    // Escrever o sitemap
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.statusCode = 500;
    res.end('Erro ao gerar sitemap');
    
    return {
      props: {},
    };
  }
}

// Exportar um componente vazio
export default function SiteMap() {
  // Esta página será pré-renderida no servidor
  return null;
} 