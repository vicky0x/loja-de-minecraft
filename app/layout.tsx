import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import InitApp from './components/InitApp';
import PolyfillLoader from './components/PolyfillLoader';
import SalesNotification from './components/SalesNotification';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minecraft Original Barato - Contas Full Acesso | Entrega Imediata | Fantasy Store",
  description: "Compre Minecraft Java e Bedrock com menor preço do Brasil. Entrega automática, pagamento seguro e suporte 24/7. Contas originais com garantia e acesso completo.",
  keywords: "minecraft, minecraft original, minecraft barato, minecraft java edition, minecraft bedrock, comprar minecraft, minecraft account, minecraft full access, minecraft original barato",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  applicationName: "Fantasy Store",
  publisher: "Fantasy Store",
  authors: [{ name: "Fantasy Store Team" }],
  creator: "Fantasy Store Team",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
    { media: "(prefers-color-scheme: light)", color: "#6C63FF" },
  ],
  appleWebApp: {
    capable: true,
    title: "Fantasy Store",
    statusBarStyle: "black-translucent",
  },
  generator: "Next.js",
  openGraph: {
    title: "Minecraft Original Barato - Contas Full Acesso | Fantasy Store",
    description: "Compre Minecraft Original barato e confiável com Full Acesso. Entrega imediata após pagamento e suporte 24/7.",
    type: "website",
    url: "https://fantasystore.com.br",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minecraft Original Barato - Contas Full Acesso | Fantasy Store",
    description: "Compre Minecraft Original barato e confiável com Full Acesso. Entrega imediata após pagamento e suporte 24/7.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32" },
      { url: "/favicon/favicon-48x48.png", sizes: "48x48" },
      { url: "/favicon/favicon-64x64.png", sizes: "64x64" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96" },
      { url: "/favicon/favicon-128x128.png", sizes: "128x128" },
      { url: "/favicon/favicon-196x196.png", sizes: "196x196" }
    ],
    shortcut: "/favicon/favicon-196x196.png",
    apple: [
      { url: "/favicon/favicon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/favicon/favicon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/favicon/favicon-167x167.png", sizes: "167x167", type: "image/png" }
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/favicon/favicon-180x180.png",
      },
      {
        rel: "mask-icon",
        url: "/favicon/favicon-512x512.png",
        color: "#6C63FF", // cor primária do site
      }
    ]
  },
};

// Dados JSON-LD para SEO
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Fantasy Store",
  "url": "https://fantasystore.com.br",
  "logo": "https://fantasystore.com.br/images/logo.png",
  "description": "Loja especializada em contas originais de Minecraft com garantia e preço justo",
  "sameAs": [
    "https://www.youtube.com/@fantasystoreloja",
    "https://discord.gg/2q8QrcuP9v",
    "https://www.trustpilot.com/review/fantasystore.com.br"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "Portuguese"
  }
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://fantasystore.com.br",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://fantasystore.com.br/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Minecraft Java + Bedrock Edition Full Acesso",
  "image": "https://fantasystore.com.br/images/products/minecraft-java-bedrock.jpg",
  "description": "Conta de Minecraft Original com Java e Bedrock Edition, full acesso, entrega imediata após pagamento confirmado.",
  "brand": {
    "@type": "Brand",
    "name": "Microsoft"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://fantasystore.com.br/product/minecraft-java-bedrock-edition",
    "priceCurrency": "BRL",
    "price": "149.99",
    "priceValidUntil": "2024-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Fantasy Store"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "352"
  }
};

const breadcrumbsJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://fantasystore.com.br"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Produtos",
      "item": "https://fantasystore.com.br/products"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Minecraft Java + Bedrock Edition",
      "item": "https://fantasystore.com.br/product/minecraft-java-bedrock-edition"
    }
  ]
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "As contas de Minecraft vendidas são originais?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, todas as nossas contas são 100% originais e legítimas, adquiridas através de fornecedores autorizados. Oferecemos garantia de até 365 dias em todas as nossas contas."
      }
    },
    {
      "@type": "Question",
      "name": "Como funciona a entrega das contas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A entrega é automática e imediata após a confirmação do pagamento. Você receberá os dados de acesso da sua conta por e-mail e na área do cliente."
      }
    },
    {
      "@type": "Question",
      "name": "Qual a diferença entre a Fantasy Store e outras lojas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Fantasy Store vende apenas contas 100% legítimas, obtidas através de parcerias com fornecedores autorizados. Oferecemos garantia de até 365 dias e suporte 24/7, diferente de outras lojas que podem vender contas obtidas por meios ilegais."
      }
    }
  ]
};

const reviewsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Pedro Silva"
      },
      "reviewBody": "Excelente loja! Comprei minha conta de Minecraft e recebi em menos de 5 minutos após o pagamento."
    },
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Maria Santos"
      },
      "reviewBody": "Super recomendo! Conta entregue rapidamente e com suporte ótimo quando precisei de ajuda."
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon/favicon-180x180.png" />
        <meta name="theme-color" content="#6C63FF" />
        
        {/* Meta tag para desativar CSP */}
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; font-src * data:;" />
        
        {/* JSON-LD Scripts para SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }}
        />

        {/* JivoChat */}
        <script src="//code.jivosite.com/widget/OnhTfOXQRg" async></script>

        {/* Meta tags específicas para iOS que não podem ser configuradas através da API de metadados */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} bg-dark-100 text-white antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <CartProvider>
            <Providers>
              <PolyfillLoader />
              <div className="flex flex-col min-h-screen">
                <div className="flex-none">
                  <Navbar />
                </div>
                <main className="flex-grow pt-16 md:pt-20">
                  {children}
                </main>
                <div className="flex-none">
                  <Footer />
                </div>
                <InitApp />
                
                {/* Componente de notificações de vendas falsas */}
                <SalesNotification />
              </div>
            </Providers>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
