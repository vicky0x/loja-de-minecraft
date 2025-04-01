import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fantasy Store",
  description: "Loja de cheats para jogos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-dark-100 text-white`}>
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
            </Providers>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
