'use client';

import React from 'react';
import AnnouncementList from '@/app/components/announcements/AnnouncementList';
import { FiBell } from 'react-icons/fi';

export default function DashboardAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-dark-200 p-4 rounded-lg border-l-4 border-primary mb-6 shadow-md hover:shadow-lg transition-all duration-500 ease-in-out transform hover:-translate-y-1 hover:border-l-8">
        <div className="flex items-center">
          <div className="text-primary mr-3 transition-all duration-500 ease-in-out transform hover:scale-110 hover:rotate-12">
            <FiBell className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 transition-all duration-300 ease-in-out">Anúncios da Plataforma</h1>
            <p className="text-gray-400 transition-all duration-300 ease-in-out">
              Confira as últimas novidades, atualizações e informações importantes.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-dark-300/30 p-4 rounded-lg shadow-md transition-all duration-500 ease-in-out hover:bg-dark-300/40">
        <AnnouncementList />
      </div>
    </div>
  );
}
