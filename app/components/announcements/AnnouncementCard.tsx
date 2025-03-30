'use client';

import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

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
}

const AnnouncementCard = ({ announcement }: AnnouncementCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data indisponível';
    }
  };

  return (
    <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-4 border-b border-dark-400">
        <div className="flex items-center mb-2">
          {announcement.authorImage ? (
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              <img 
                src={announcement.authorImage} 
                alt={announcement.authorName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
              {announcement.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-medium text-white">{announcement.authorName}</h3>
            <p className="text-xs text-gray-400">{announcement.authorRole}</p>
          </div>
          <div className="ml-auto text-xs text-gray-400">
            {formatDate(announcement.createdAt)}
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mt-2">{announcement.title}</h2>
      </div>
      
      <div className="p-4">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{announcement.content}</ReactMarkdown>
        </div>
        
        {announcement.imageUrl && (
          <div className="mt-4">
            <img 
              src={announcement.imageUrl} 
              alt={announcement.title}
              className="w-full h-auto rounded-lg"
            />
          </div>
        )}
        
        {announcement.videoUrl && (
          <div className="mt-4 aspect-video">
            <iframe
              src={announcement.videoUrl}
              className="w-full h-full rounded-lg"
              title={announcement.title}
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
