'use client';

import React from 'react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-dark-100 text-white p-4">
      <div className="container mx-auto pt-12 pb-8">
        {children}
      </div>
    </main>
  );
} 