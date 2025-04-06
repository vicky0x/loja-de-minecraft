'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { FiClock, FiEdit2, FiTrash2, FiX, FiMaximize, FiUser } from 'react-icons/fi';

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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Verificar se o anúncio contém todas as propriedades necessárias
    if (!announcement.title || !announcement.content || !announcement.authorName) {
      console.error('Anúncio com dados incompletos:', announcement);
      setHasError(true);
    }
  }, [announcement]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString);
      return 'Data indisponível';
    }
  };

  const getRoleClass = (role: string) => {
    const roleLower = role.toLowerCase();
    switch(roleLower) {
      case 'administrador':
      case 'admin':
        return 'bg-gradient-to-r from-purple-950 to-purple-900 text-white border-purple-700';
      case 'moderador':
      case 'mod':
        return 'bg-gradient-to-r from-blue-950 to-blue-900 text-white border-blue-700';
      case 'suporte':
      case 'support':
        return 'bg-gradient-to-r from-green-950 to-green-900 text-white border-green-700';
      case 'desenvolvedor':
      case 'dev':
        return 'bg-gradient-to-r from-red-950 to-red-900 text-white border-red-700';
      default:
        return 'bg-gradient-to-r from-gray-800 to-gray-700 text-white border-gray-600';
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

  if (hasError) {
    return (
      <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30 text-red-300">
        <p>Erro ao exibir anúncio - dados incompletos</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-gradient-to-br from-dark-300 to-dark-200 rounded-xl shadow-xl overflow-hidden h-full border border-dark-400 hover:border-primary/30 transition-all duration-300 announcement-card">
        {/* Cabeçalho com informações do autor */}
        <div className="p-5 border-b border-dark-400 bg-dark-300/80 backdrop-blur-sm flex items-center announcement-header">
          {announcement.authorImage ? (
            <div className="w-16 h-16 rounded-full overflow-hidden mr-4 ring-2 ring-primary shadow-lg">
              <img 
                src={announcement.authorImage} 
                alt={announcement.authorName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                }}
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-2xl mr-4 ring-2 ring-primary shadow-lg">
              <FiUser size={28} />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h2 className="font-bold text-white text-lg">
                {announcement.title}
              </h2>
              <span className={`text-xs px-4 py-1.5 rounded-full font-bold ${getRoleClass(announcement.authorRole)} border shadow-md ml-2`}>
                {getFormattedRole(announcement.authorRole)}
              </span>
            </div>
            <div className="flex flex-col mt-2">
              <span className="text-primary font-bold text-xl tracking-wide">
                {announcement.authorName}
              </span>
              <div className="flex items-center text-gray-400 opacity-80 text-xs mt-1">
                <FiClock className="mr-1" size={12} />
                <span>{formatDate(announcement.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Conteúdo do anúncio */}
        <div className="p-5">
          {/* Texto do conteúdo */}
          <div className="prose prose-invert prose-p:text-gray-200 prose-p:whitespace-pre-line prose-p:break-words max-w-none text-sm mb-5 min-h-[50px] leading-relaxed">
            <ReactMarkdown 
              components={{
                a: ({node, ...props}) => <a {...props} className="text-primary hover:text-primary-light underline transition-colors duration-300" target="_blank" rel="noreferrer" />,
                p: ({node, ...props}) => <p {...props} className="mb-3 whitespace-pre-line leading-relaxed" />,
                ul: ({node, ...props}) => <ul {...props} className="pl-5 mb-3" />,
                li: ({node, ...props}) => <li {...props} className="mb-1" />,
              }}
            >{announcement.content}</ReactMarkdown>
          </div>
          
          {/* Container para as imagens */}
          {(announcement.imageUrl || announcement.imageUrl2) && (
            <div className="mt-4 flex flex-wrap gap-4">
              {announcement.imageUrl && (
                <div className="relative group overflow-hidden rounded-lg shadow-lg announcement-image">
                  <img 
                    src={announcement.imageUrl} 
                    alt={announcement.title}
                    className="h-auto max-h-72 object-contain rounded-lg cursor-pointer border border-dark-400"
                    style={{ maxWidth: '100%', width: 'auto', minHeight: '150px' }}
                    onClick={() => handleZoomImage(announcement.imageUrl!)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-dark-800/80 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiMaximize className="text-white" size={16} />
                  </div>
                </div>
              )}
              {announcement.imageUrl2 && (
                <div className="relative group overflow-hidden rounded-lg shadow-lg announcement-image">
                  <img 
                    src={announcement.imageUrl2} 
                    alt={`${announcement.title} - imagem 2`}
                    className="h-auto max-h-72 object-contain rounded-lg cursor-pointer border border-dark-400"
                    style={{ maxWidth: '100%', width: 'auto', minHeight: '150px' }}
                    onClick={() => handleZoomImage(announcement.imageUrl2!)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-dark-800/80 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <FiMaximize className="text-white" size={16} />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {announcement.videoUrl && !announcement.imageUrl && !announcement.imageUrl2 && (
            <div className="mt-4 aspect-video overflow-hidden rounded-lg shadow-lg border border-dark-400" style={{ maxWidth: '80%' }}>
              <iframe
                src={announcement.videoUrl}
                className="w-full h-full rounded-lg"
                title={announcement.title}
                allowFullScreen
              ></iframe>
            </div>
          )}
          
          {/* Botões de ação para administradores */}
          {isAdmin && onEdit && onDelete && (
            <div className="mt-6 pt-4 border-t border-dark-400 flex justify-end">
              <button
                onClick={() => onEdit(announcement)}
                className="px-4 py-2 bg-dark-400 hover:bg-dark-500 text-white rounded-md mr-3 announcement-button transition-colors shadow-md"
                title="Editar anúncio"
              >
                <div className="flex items-center">
                  <FiEdit2 size={16} />
                  <span className="ml-2 text-sm font-medium">Editar</span>
                </div>
              </button>
              <button
                onClick={() => onDelete(announcement._id)}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md announcement-button transition-colors shadow-md"
                title="Excluir anúncio"
              >
                <div className="flex items-center">
                  <FiTrash2 size={16} />
                  <span className="ml-2 text-sm font-medium">Excluir</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de zoom */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 announcement-zoom-modal backdrop-blur-md"
          onClick={closeZoom}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                closeZoom();
              }}
              className="absolute top-2 right-2 bg-dark-800/90 p-2 rounded-full text-white hover:bg-primary transition-all duration-300"
            >
              <FiX size={24} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Imagem ampliada" 
              className="w-auto h-auto max-w-full max-h-[90vh] object-contain mx-auto rounded-lg shadow-2xl"
              onError={(e) => {
                closeZoom();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementCard;
