'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import AnnouncementEditor from '@/app/components/admin/AnnouncementEditor';
import AnnouncementCard from '@/app/components/announcements/AnnouncementCard';
import { toast } from 'react-hot-toast';

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

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

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
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
      setError('Não foi possível carregar os anúncios. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) {
      return;
    }
    
    try {
      // Obter dados do usuário do localStorage para autenticação
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': userData
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao excluir anúncio');
      }
      
      toast.success('Anúncio excluído com sucesso!');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Erro ao excluir anúncio:', error);
      toast.error(error.message || 'Erro ao excluir anúncio');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveComplete = () => {
    fetchAnnouncements();
    setShowEditor(false);
    setEditingAnnouncement(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Gerenciar Anúncios</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchAnnouncements()}
            className="p-2 bg-dark-300 text-white rounded-md hover:bg-dark-400 transition-colors"
            title="Atualizar"
          >
            <div className="flex items-center justify-center">
              <FiRefreshCw />
            </div>
          </button>
          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setShowEditor(!showEditor);
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors flex items-center"
          >
            {showEditor && !editingAnnouncement ? (
              <>Cancelar</>
            ) : (
              <>
                <div className="mr-2">
                  <FiPlus />
                </div>
                Novo Anúncio
              </>
            )}
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingAnnouncement ? 'Editar Anúncio' : 'Criar Novo Anúncio'}
          </h2>
          <AnnouncementEditor 
            onSave={handleSaveComplete} 
            editingAnnouncement={editingAnnouncement || undefined}
          />
        </div>
      )}

      <div className="bg-dark-300 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Anúncios Publicados</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-dark-200 rounded-lg p-4 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAnnouncements}
              className="flex items-center justify-center mx-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
            >
              <div className="mr-2">
                <FiRefreshCw />
              </div>
              Tentar novamente
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-dark-200 rounded-lg p-6 text-center">
            <p className="text-gray-400">Nenhum anúncio publicado.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="relative">
                <div className="absolute top-4 right-4 flex space-x-2 z-10">
                  <button
                    onClick={() => handleEditAnnouncement(announcement)}
                    className="p-2 bg-dark-400/80 hover:bg-dark-400 text-white rounded-md transition-colors"
                    title="Editar"
                  >
                    <div className="flex items-center justify-center">
                      <FiEdit2 />
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                    className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-md transition-colors"
                    title="Excluir"
                  >
                    <div className="flex items-center justify-center">
                      <FiTrash2 />
                    </div>
                  </button>
                </div>
                <AnnouncementCard announcement={announcement} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
