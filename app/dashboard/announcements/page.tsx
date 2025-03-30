'use client';

import React from 'react';
import AnnouncementList from '@/app/components/announcements/AnnouncementList';

export default function DashboardAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Anúncios</h1>
      <p className="text-gray-400">
        Confira os anúncios oficiais da plataforma.
      </p>
      
      <div className="mt-6">
        <AnnouncementList />
      </div>
    </div>
  );
}
