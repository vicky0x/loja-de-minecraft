'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementCard from './AnnouncementCard';
import { FiRefreshCw } from 'react-icons/fi';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/announcements');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar anúncios');
      }
      
      const data = await response.json();
      setAnnouncements(data.announcements);
    } catch (error: any) {
      console.error('Erro ao buscar anúncios:', error);
      setError('Não foi possível carregar os anúncios. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    
    // Configurar atualização em tempo real (a cada 30 segundos)
    const interval = setInterval(() => {
      fetchAnnouncements();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-200 rounded-lg p-4 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="flex items-center justify-center mx-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
        >
          <span className="mr-2">
            <FiRefreshCw />
          </span>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-dark-200 rounded-lg p-6 text-center shadow-md transition-all duration-500 ease-in-out">
        <p className="text-gray-400">Nenhum anúncio disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {announcements.map((announcement: Announcement, index: number) => (
        <div 
          key={announcement._id} 
          className="mb-2 opacity-0 animate-fadeInUp"
          style={{ 
            animationDelay: `${index * 100}ms`, 
            animationDuration: '500ms',
            animationFillMode: 'forwards' 
          }}
        >
          <AnnouncementCard announcement={announcement} />
        </div>
      ))}
    </div>
  );
};

export default AnnouncementList;
