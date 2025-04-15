'use client';

import dynamic from 'next/dynamic';

const CharlaWidget = dynamic(() => import('./CharlaWidget'), { ssr: false });

export default function CharlaWidgetWrapper() {
  return <CharlaWidget />;
} 