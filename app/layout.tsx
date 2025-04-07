import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import GlobalAppInitializer from './_app/globals';
import CharlaWidgetWrapper from './components/CharlaWidgetWrapper';
import InitApp from './components/InitApp';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fantasy Store - Contas Minecraft Premium Original | Menor Preço",
  description: "Loja especializada em Contas Minecraft Premium originais com garantia de até 365 dias. Compre Minecraft Java e Bedrock com entrega automática e imediata.",
  keywords: "loja minecraft, contas minecraft, minecraft premium, minecraft original, minecraft java, minecraft bedrock, comprar minecraft, minecraft barato, garantia minecraft",
  authors: [{ name: "Fantasy Store" }],
  generator: "Next.js",
  openGraph: {
    title: "Fantasy Store - Contas Minecraft Premium Original | Menor Preço",
    description: "Loja especializada em Contas Minecraft Premium originais com garantia de até 365 dias. Compre Minecraft Java e Bedrock com entrega automática e imediata.",
    url: "https://fantasystore.com.br",
    siteName: "Fantasy Store Minecraft",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantasy Store - Contas Minecraft Premium Original | Menor Preço",
    description: "Loja especializada em Contas Minecraft Premium originais com garantia de até 365 dias. Compre Minecraft Java e Bedrock com entrega automática e imediata.",
  },
  alternates: {
    canonical: "https://fantasystore.com.br",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className={`${inter.className} bg-dark-100 text-white`}>
        <InitApp />
        <AuthProvider>
          <CartProvider>
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(23, 23, 28, 0.9)',
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  padding: '12px 20px',
                  maxWidth: '400px',
                },
                success: {
                  iconTheme: {
                    primary: '#6c63ff',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#FF5A5A',
                    secondary: '#FFFFFF',
                  },
                },
                className: '!bg-dark-300/90 !border-dark-400/30',
              }}
            />
            <Providers>
              <Navbar />
              <main className="pt-20">
                {children}
              </main>
              <Footer />
              <CharlaWidgetWrapper />
            </Providers>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
