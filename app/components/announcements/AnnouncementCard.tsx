'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { FiClock, FiBriefcase, FiEdit2, FiTrash2, FiX, FiMaximize } from 'react-icons/fi';

interface AnnouncementCardProps {
  announcement: {
    _id: string;
    title: string;
    content: string;
    authorName: string;
    authorRole: string;
    authorImage?: string;
    imageUrl?: string;
    imageUrl2?: string;
    videoUrl?: string;
    createdAt: string;
  };
  onEdit?: (announcement: any) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const AnnouncementCard = ({ announcement, onEdit, onDelete, isAdmin = false }: AnnouncementCardProps) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data indisponível';
    }
  };

  const getRoleClass = (role: string) => {
    const roleLower = role.toLowerCase();
    switch(roleLower) {
      case 'administrador':
      case 'admin':
        return 'bg-purple-900/40 text-purple-400';
      case 'moderador':
      case 'mod':
        return 'bg-blue-900/40 text-blue-400';
      case 'suporte':
      case 'support':
        return 'bg-green-900/40 text-green-400';
      case 'desenvolvedor':
      case 'dev':
        return 'bg-red-900/40 text-red-400';
      default:
        return 'bg-gray-800/40 text-gray-400';
    }
  };

  const getFormattedRole = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'admin') return 'Administrador';
    if (roleLower === 'mod') return 'Moderador';
    if (roleLower === 'dev') return 'Desenvolvedor';
    if (roleLower === 'support') return 'Suporte';
    return role;
  };

  const handleZoomImage = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  return (
    <>
      <div className="bg-dark-200 rounded-lg shadow-lg overflow-hidden h-full border border-dark-400 hover:border-primary/30 hover:shadow-xl transition-all duration-500 ease-in-out transform hover:-translate-y-1 announcement-card">
        {/* Cabeçalho com informações do autor */}
        <div className="p-3 border-b border-dark-400 bg-dark-300 flex items-center announcement-header">
          {announcement.authorImage ? (
            <div className="w-12 h-12 rounded-full overflow-hidden mr-3 ring-2 ring-primary/50 transition-all duration-300 ease-in-out hover:ring-primary">
              <img 
                src={announcement.authorImage} 
                alt={announcement.authorName}
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-110"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mr-3 ring-2 ring-primary/50 transition-all duration-300 ease-in-out hover:ring-primary hover:bg-primary/90">
              {announcement.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-base">{announcement.title}</h2>
              <span className={`text-xs px-2 py-1 rounded font-medium ${getRoleClass(announcement.authorRole)}`}>
                {getFormattedRole(announcement.authorRole)}
              </span>
            </div>
            <div className="flex items-center text-xs mt-1">
              <span className="text-primary font-medium">{announcement.authorName}</span>
              <div className="flex items-center text-gray-500 ml-2">
                <FiClock className="mr-1" size={12} />
                <span>{formatDate(announcement.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Conteúdo do anúncio */}
        <div className="p-3">
          {/* Texto do conteúdo */}
          <div className="prose prose-invert prose-p:whitespace-pre-line prose-p:break-words max-w-none text-sm mb-3 min-h-[50px] leading-snug">
            <ReactMarkdown 
              components={{
                a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noreferrer" />,
                p: ({node, ...props}) => <p {...props} className="mb-1 whitespace-pre-line leading-tight" style={{lineHeight: '1.2'}} />,
                ul: ({node, ...props}) => <ul {...props} className="pl-4 mb-2" />,
                li: ({node, ...props}) => <li {...props} className="mb-0.5" />,
              }}
            >{announcement.content}</ReactMarkdown>
          </div>
          
          {/* Container para as imagens */}
          {(announcement.imageUrl || announcement.imageUrl2) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {announcement.imageUrl && (
                <div className="relative group overflow-hidden rounded-md announcement-image">
                  <img 
                    src={announcement.imageUrl} 
                    alt={announcement.title}
                    className="h-auto max-h-64 object-contain rounded-md cursor-pointer"
                    style={{ maxWidth: '100%', width: 'auto', minHeight: '150px' }}
                    onClick={() => handleZoomImage(announcement.imageUrl!)}
                  />
                  <div className="absolute top-1 right-1 bg-dark-800/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out transform group-hover:scale-110">
                    <FiMaximize className="text-white" size={12} />
                  </div>
                </div>
              )}
              {announcement.imageUrl2 && (
                <div className="relative group overflow-hidden rounded-md announcement-image">
                  <img 
                    src={announcement.imageUrl2} 
                    alt={`${announcement.title} - imagem 2`}
                    className="h-auto max-h-64 object-contain rounded-md cursor-pointer"
                    style={{ maxWidth: '100%', width: 'auto', minHeight: '150px' }}
                    onClick={() => handleZoomImage(announcement.imageUrl2!)}
                  />
                  <div className="absolute top-1 right-1 bg-dark-800/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out transform group-hover:scale-110">
                    <FiMaximize className="text-white" size={12} />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {announcement.videoUrl && !announcement.imageUrl && !announcement.imageUrl2 && (
            <div className="mt-2 aspect-video overflow-hidden rounded-md" style={{ maxWidth: '70%' }}>
              <iframe
                src={announcement.videoUrl}
                className="w-full h-full"
                title={announcement.title}
                allowFullScreen
              ></iframe>
            </div>
          )}
          
          {/* Botões de ação para administradores */}
          {isAdmin && onEdit && onDelete && (
            <div className="mt-4 pt-3 border-t border-dark-400 flex justify-end">
              <button
                onClick={() => onEdit(announcement)}
                className="p-2 bg-dark-400/80 hover:bg-dark-400 text-white rounded-md mr-2 announcement-button"
                title="Editar aqui mesmo"
              >
                <div className="flex items-center">
                  <FiEdit2 size={16} />
                  <span className="ml-1 text-xs">Editar aqui</span>
                </div>
              </button>
              <button
                onClick={() => onDelete(announcement._id)}
                className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-md announcement-button"
                title="Excluir"
              >
                <div className="flex items-center">
                  <FiTrash2 size={16} />
                  <span className="ml-1 text-xs">Excluir</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de zoom */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn announcement-zoom-modal" onClick={closeZoom}>
          <div className="relative max-w-5xl max-h-[90vh] w-full animate-scaleIn">
            <button 
              onClick={closeZoom}
              className="absolute top-2 right-2 bg-dark-800/90 p-2 rounded-full text-white hover:bg-dark-700 transition-all duration-300 ease-in-out transform hover:rotate-90 announcement-button"
            >
              <FiX size={24} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Imagem ampliada" 
              className="w-auto h-auto max-w-full max-h-[90vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementCard;
