'use client';

import Head from 'next/head';
import Canonical from './Canonical';

interface SEOMetaTagsProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
}

/**
 * Componente para adicionar meta tags SEO às páginas
 * 
 * @param {object} props - Propriedades do componente
 */
export default function SEOMetaTags({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage = '/images/og-default.jpg',
  ogImageAlt = 'Minecraft Loja - Contas originais',
  twitterCard = 'summary_large_image',
  noIndex = false
}: SEOMetaTagsProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://minecraftloja.com.br';
  const fullTitle = `${title} | Minecraft Loja`;
  
  // Garantir que a URL da imagem seja absoluta
  const ogImageUrl = ogImage.startsWith('http') 
    ? ogImage 
    : `${siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

  return (
    <>
      <Head>
        {/* Meta tags básicas */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
        
        {/* Meta tags Open Graph para redes sociais */}
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}${canonicalPath || ''}`} />
        <meta property="og:site_name" content="Minecraft Loja" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:alt" content={ogImageAlt} />
        
        {/* Meta tags Twitter Card */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        
        {/* Meta tag para idioma */}
        <meta httpEquiv="content-language" content="pt-BR" />
      </Head>
      
      {/* Adicionar URL canônica */}
      <Canonical path={canonicalPath} />
    </>
  );
} 