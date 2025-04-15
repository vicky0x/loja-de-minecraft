import Header from '../components/Header';
import Footer from '../components/Footer';
import Script from 'next/script';

interface CanonicalLayoutProps {
  children: React.ReactNode;
  params?: any;
}

export default function SiteLayout({
  children,
  params
}: CanonicalLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Script id="canonical-tag" strategy="afterInteractive">
        {`
          // Script para gerenciar URLs canônicas automaticamente
          (function() {
            const currentPath = window.location.pathname;
            const currentUrl = window.location.href;
            const urlObj = new URL(currentUrl);
            
            // Remover parâmetros de consulta para URLs canônicas
            let canonicalUrl = window.location.origin + currentPath;
            
            // Casos especiais para páginas com paginação ou filtros
            if (currentPath === '/products' && urlObj.searchParams.toString()) {
              canonicalUrl = window.location.origin + '/products';
            }
            
            if (currentPath.startsWith('/search')) {
              canonicalUrl = window.location.origin + '/products';
            }
            
            // Criar ou atualizar a tag canonical
            let canonicalTag = document.querySelector('link[rel="canonical"]');
            if (!canonicalTag) {
              canonicalTag = document.createElement('link');
              canonicalTag.setAttribute('rel', 'canonical');
              document.head.appendChild(canonicalTag);
            }
            canonicalTag.setAttribute('href', canonicalUrl);
          })();
        `}
      </Script>
      <Header />
      <main className="flex-grow pt-16 md:pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
} 