'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementCard from './AnnouncementCard';
import { FiRefreshCw, FiAlertCircle, FiBell } from 'react-icons/fi';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  authorImage?: string;
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
        throw new Error(`Falha ao carregar anúncios: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.announcements && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else {
        setError('Formato de dados inválido recebido do servidor');
      }
    } catch (error: any) {
      setError(`Não foi possível carregar os anúncios. ${error.message || 'Tente novamente mais tarde.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    
    // Configurar atualização em tempo real (a cada 60 segundos)
    const interval = setInterval(() => {
      fetchAnnouncements();
    }, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-dark-300/30 rounded-xl backdrop-blur-sm shadow-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-primary/20"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        </div>
        <p className="text-gray-300 mt-4 font-medium text-lg">Carregando anúncios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-dark-300 to-dark-200 rounded-xl p-8 text-center shadow-lg border border-red-900/30">
        <div className="bg-red-900/20 p-3 rounded-full inline-flex items-center justify-center mb-4">
          <FiAlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Erro ao carregar anúncios</h3>
        <p className="text-red-300 mb-5 font-medium">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="flex items-center justify-center mx-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-300 shadow-lg"
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
      <div className="bg-gradient-to-br from-dark-300 to-dark-200 rounded-xl p-8 text-center shadow-lg border border-dark-400 backdrop-blur-sm">
        <div className="bg-dark-400/50 p-3 rounded-full inline-flex items-center justify-center mb-4">
          <FiBell className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Sem anúncios disponíveis</h3>
        <p className="text-gray-400 font-medium">Nenhum anúncio foi publicado até o momento.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      {announcements.map((announcement: Announcement) => (
        <div key={announcement._id} className="mb-4 announcement-item">
          <AnnouncementCard 
            announcement={announcement} 
          />
        </div>
      ))}
    </div>
  );
};

export default AnnouncementList;
