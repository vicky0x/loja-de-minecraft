import { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Fantasy Cheats",
  description: "Sua loja de cheats e hacks para jogos",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <Navbar />
          <main className="pt-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
