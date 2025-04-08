'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiX } from 'react-icons/fi';
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
  const [editingInline, setEditingInline] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/announcements');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar anúncios');
      }
      
      const data = await response.json();
      console.log('Anúncios carregados:', data.announcements);
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
    setEditingAnnouncement({...announcement});
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditInline = (announcement: Announcement) => {
    setEditingInline({...announcement});
  };

  const handleSaveComplete = () => {
    fetchAnnouncements();
    setShowEditor(false);
    setEditingAnnouncement(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">Anúncios</h1>
        <button
          onClick={() => {
            setEditingAnnouncement(null);
            setShowEditor(!showEditor);
          }}
          className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          {showEditor && !editingAnnouncement ? (
            <>
              <FiX className="mr-2" />
              Cancelar
            </>
          ) : (
            <>
              <FiPlus className="mr-2" />
              Novo Anúncio
            </>
          )}
        </button>
      </div>

      {showEditor && (
        <div className="mb-8">
          <AnnouncementEditor
            onSave={handleSaveComplete}
            editingAnnouncement={editingAnnouncement}
            onCancel={() => {
              setShowEditor(false);
              setEditingAnnouncement(null);
            }}
          />
        </div>
      )}

      {/* Lista de Anúncios */}
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-600/20 border border-red-600 text-white p-4 rounded mb-6">
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div key={announcement._id}>
                {editingInline && editingInline._id === announcement._id ? (
                  <div className="mb-6">
                    <AnnouncementEditor
                      onSave={() => {
                        setEditingInline(null);
                        fetchAnnouncements();
                      }}
                      editingAnnouncement={editingInline}
                      onCancel={() => setEditingInline(null)}
                    />
                  </div>
                ) : (
                  <AnnouncementCard
                    announcement={announcement}
                    isAdmin={true}
                    onEdit={handleEditInline}
                    onDelete={handleDeleteAnnouncement}
                  />
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-dark-200 border border-dark-400 rounded-lg p-6 text-center">
              <p className="text-gray-400">Nenhum anúncio encontrado.</p>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setShowEditor(true);
                }}
                className="mt-4 bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded inline-flex items-center"
              >
                <FiPlus className="mr-2" />
                Criar Anúncio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
