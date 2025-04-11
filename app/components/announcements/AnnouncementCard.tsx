'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { FiClock, FiEdit2, FiTrash2, FiX, FiMaximize, FiUser, FiCheck, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ImageZoom from '../ui/ImageZoom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import ConfirmationModal from '../ui/ConfirmationModal';

interface AnnouncementCardProps {
  announcement: {
    _id: string;
    title: string;
    content: string;
    authorName: string;
    authorRole: string;
    authorImage?: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: string;
  };
  onEdit?: (announcement: any) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

// Função auxiliar para extrair o ID do vídeo do YouTube
const extractYouTubeId = (url: string): string => {
  // Se já for um ID simples (sem URL)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  
  // Se for uma URL de incorporação, extrair o ID
  if (url.includes('youtube.com/embed/')) {
    return url.split('youtube.com/embed/')[1].split('?')[0];
  }
  
  // Se for uma URL completa, extrair o ID
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : url;
};

const AnnouncementCard = ({ announcement, onEdit, onDelete, isAdmin = false }: AnnouncementCardProps) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Adiciona uma classe ao body quando o modal de zoom está aberto
  useEffect(() => {
    if (zoomedImage) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [zoomedImage]);

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
        return 'bg-gradient-to-r from-primary to-primary/80 text-white border-primary/40';
      case 'moderador':
      case 'mod':
        return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400';
      case 'suporte':
      case 'support':
        return 'bg-gradient-to-r from-green-600 to-green-500 text-white border-green-400';
      case 'desenvolvedor':
      case 'dev':
        return 'bg-gradient-to-r from-amber-500 to-amber-400 text-white border-amber-300';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-500 text-white border-gray-400';
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
      <div className="relative bg-gradient-to-br from-dark-200 to-dark-300 rounded-xl shadow-xl overflow-hidden h-full border border-dark-400">
        {/* Cabeçalho com informações do autor */}
        <div 
          className="py-4 px-5 border-b border-dark-400 flex items-center relative" 
          style={{
            backgroundColor: 'transparent',
            transition: 'none !important',
            borderColor: '#444444 !important',
            zIndex: '1'
          }}
        >
          {announcement.authorImage ? (
            <div className="w-14 h-14 rounded-full overflow-hidden mr-4 ring-1 ring-primary shadow-lg relative border border-primary/30 bg-dark-300">
              <img 
                src={announcement.authorImage} 
                alt={announcement.authorName}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                }}
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center font-bold text-xl mr-4 ring-1 ring-primary shadow-lg relative border border-primary/30">
              <FiUser size={24} />
            </div>
          )}
          <div className="flex-1 relative">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-white font-bold text-xl tracking-wide mr-1.5">
                  {announcement.authorName}
                </span>
                {/* Selo de verificado */}
                <div className="bg-primary/15 p-1 rounded-full border border-primary/30 flex items-center justify-center shadow-sm">
                  <FiCheck className="text-primary" size={14} strokeWidth={3} />
                </div>
              </div>
              <div className="flex items-center text-gray-400 opacity-90 text-xs mt-1">
                <FiClock className="mr-1" size={12} />
                <span className="text-[11px]">{formatDate(announcement.createdAt)}</span>
              </div>
            </div>
          </div>
          {announcement.authorRole && (
            <span className={`text-xs px-4 py-1.5 rounded-full font-semibold ${getRoleClass(announcement.authorRole)} border shadow-md ml-auto text-[12px]`} style={{position: 'relative', zIndex: '1'}}>
              {getFormattedRole(announcement.authorRole)}
            </span>
          )}
        </div>
        
        {/* Conteúdo do anúncio */}
        <div className="p-5">
          {/* Título do anúncio */}
          <div className="flex items-start mb-5 pb-3 border-b border-dark-400 bg-gradient-to-r from-dark-300/50 to-transparent rounded-lg p-3 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg"></div>
            <h2 className="font-bold text-white text-lg md:text-xl leading-tight break-words relative z-10">
              {announcement.title}
            </h2>
          </div>

          {/* Texto do conteúdo */}
          <div className="prose prose-invert prose-p:text-gray-200 prose-p:whitespace-pre-line prose-p:break-words max-w-none text-sm mb-5 min-h-[50px] leading-relaxed">
            <ReactMarkdown 
              components={{
                a: ({node, ...props}) => <a {...props} className="text-primary hover:text-primary/80 underline transition-colors duration-300" target="_blank" rel="noreferrer" />,
                p: ({node, ...props}) => <p {...props} className="mb-3 whitespace-pre-line leading-relaxed" />,
                ul: ({node, ...props}) => <ul {...props} className="pl-5 mb-3" />,
                li: ({node, ...props}) => <li {...props} className="mb-1" />,
              }}
            >{announcement.content}</ReactMarkdown>
          </div>
          
          {/* Container para as imagens */}
          {announcement.imageUrl && (
            <div className="mt-4">
              <div className="relative overflow-hidden rounded-[20px] shadow-lg announcement-image">
                <img 
                  src={announcement.imageUrl} 
                  alt={announcement.title}
                  className="w-full max-w-full h-auto object-cover rounded-[20px] cursor-pointer border border-dark-400"
                  style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                  onClick={() => handleZoomImage(announcement.imageUrl!)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div 
                  className="absolute bottom-3 right-3 bg-primary/90 hover:bg-primary rounded-full p-2.5 shadow-lg cursor-pointer transform transition-transform duration-300 hover:scale-110"
                  onClick={() => handleZoomImage(announcement.imageUrl!)}
                >
                  <FiMaximize className="text-white" size={18} />
                </div>
              </div>
            </div>
          )}
          
          {announcement.videoUrl && !announcement.imageUrl && (
            <div className="mt-4 overflow-hidden rounded-lg shadow-lg border border-dark-400" style={{ maxWidth: '80%' }}>
              <div className="aspect-video">
                <iframe
                  src={announcement.videoUrl.includes('youtube.com/embed/') 
                    ? announcement.videoUrl 
                    : `https://www.youtube.com/embed/${extractYouTubeId(announcement.videoUrl)}?rel=0&modestbranding=1`}
                  className="w-full h-full rounded-lg"
                  title={announcement.title}
                  allowFullScreen
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  frameBorder="0"
                ></iframe>
              </div>
            </div>
          )}
          
          {/* Botões de ação para administradores */}
          {isAdmin && onEdit && onDelete && (
            <div className="mt-6 pt-4 border-t border-dark-400 flex justify-end">
              <button
                onClick={() => onEdit(announcement)}
                className="px-4 py-2 bg-dark-400 text-white rounded-md mr-3 announcement-button"
                title="Editar anúncio"
              >
                <div className="flex items-center">
                  <FiEdit2 size={16} />
                  <span className="ml-2 text-sm font-medium">Editar</span>
                </div>
              </button>
              <button
                onClick={() => onDelete(announcement._id)}
                className="px-4 py-2 bg-red-700 text-white rounded-md announcement-button"
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
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 announcement-zoom-modal backdrop-blur-md"
          onClick={closeZoom}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                closeZoom();
              }}
              className="absolute top-2 right-2 bg-dark-800/90 p-2 rounded-full text-white z-[101]"
            >
              <FiX size={24} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Imagem ampliada" 
              className="w-auto h-auto max-w-full max-h-[90vh] object-cover mx-auto rounded-[20px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                closeZoom();
                toast.error('Erro ao carregar imagem ampliada');
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementCard;
