'use client';

import dynamic from 'next/dynamic';

const JivoChat = dynamic(() => import('./JivoChat'), { ssr: false });

export default function JivoChatWrapper() {
  return <JivoChat />;
} 