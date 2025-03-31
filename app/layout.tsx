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
            <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
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
