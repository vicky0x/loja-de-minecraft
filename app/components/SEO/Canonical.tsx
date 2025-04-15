'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface CanonicalProps {
  path?: string;
}

/**
 * Componente para adicionar URLs canônicas às páginas
 * Isso ajuda a evitar problemas de conteúdo duplicado para SEO
 * 
 * @param {string} path - Caminho opcional para sobrescrever o pathname atual
 */
export default function Canonical({ path }: CanonicalProps) {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br';
  
  // Usar o path fornecido ou o pathname atual
  const canonicalPath = path || pathname;
  
  // Remover barras duplicadas e garantir formato correto
  const url = `${baseUrl}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`
    .replace(/([^:]\/)\/+/g, '$1'); // Remove barras duplicadas exceto após ":"
  
  return (
    <Head>
      <link rel="canonical" href={url} />
    </Head>
  );
} 