'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSave, FiX, FiImage, FiVideo, FiAlertCircle, FiBold, FiItalic, FiLink, FiList } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface EditingAnnouncement {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageUrl2?: string;
  videoUrl?: string;
}

interface AnnouncementEditorProps {
  onSave: () => void;
  editingAnnouncement?: EditingAnnouncement;
  onCancel?: () => void;
}

const AnnouncementEditor = ({ onSave, editingAnnouncement, onCancel }: AnnouncementEditorProps) => {
  const [title, setTitle] = useState(editingAnnouncement?.title || '');
  const [content, setContent] = useState(editingAnnouncement?.content ? editingAnnouncement.content.replace(/\n\n&nbsp;\n\n/g, '\n\n') : '');
  const [imageUrl, setImageUrl] = useState(editingAnnouncement?.imageUrl || '');
  const [imageUrl2, setImageUrl2] = useState(editingAnnouncement?.imageUrl2 || '');
  const [videoUrl, setVideoUrl] = useState(editingAnnouncement?.videoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Normalizar quebras de linha quando o componente carrega um anúncio existente
  useEffect(() => {
    if (editingAnnouncement?.content) {
      const normalizedContent = editingAnnouncement.content
        .replace(/\n\n&nbsp;\n\n/g, '\n\n')
        .replace(/\n{3,}/g, '\n\n');
      setContent(normalizedContent);
    }
  }, [editingAnnouncement]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    
    if (!content.trim()) {
      toast.error('O conteúdo é obrigatório');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = editingAnnouncement
        ? `/api/announcements/${editingAnnouncement._id}`
        : '/api/announcements';
      
      const method = editingAnnouncement ? 'PUT' : 'POST';
      
      // Obter dados do usuário do localStorage para autenticação
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Usuário não autenticado');
      }
      
      // Garantir que quebras de linha múltiplas sejam preservadas
      const formattedContent = content.replace(/\n{2,}/g, '\n\n').trim();
      
      // Debugging: verificar os valores antes de enviar
      console.log('Enviando requisição com dados:', {
        title,
        content: formattedContent,
        imageUrl,
        imageUrl2,
        videoUrl
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': userData
        },
        body: JSON.stringify({
          title,
          content: formattedContent,
          imageUrl: imageUrl || undefined,
          imageUrl2: imageUrl2 || undefined,
          videoUrl: videoUrl || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao salvar anúncio');
      }
      
      toast.success(editingAnnouncement ? 'Anúncio atualizado com sucesso!' : 'Anúncio criado com sucesso!');
      
      // Limpar o formulário se for uma criação
      if (!editingAnnouncement) {
        setTitle('');
        setContent('');
        setImageUrl('');
        setImageUrl2('');
        setVideoUrl('');
      }
      
      // Notificar o componente pai
      onSave();
    } catch (error) {
      console.error('Erro ao salvar anúncio:', error);
      toast.error(error.message || 'Erro ao salvar anúncio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertMarkdown = (prefix, suffix = '') => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      prefix + 
      selectedText + 
      suffix + 
      content.substring(end);
    
    setContent(newContent);
    
    // Reposicionar o cursor após a inserção
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length, 
        end + prefix.length
      );
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-dark-200 rounded-lg shadow-md p-6">
      <div className="mb-4">
        <label htmlFor="title" className="block text-white font-medium mb-2">
          Título do Anúncio
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-dark-300 border border-dark-400 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Digite o título do anúncio"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="content" className="block text-white font-medium mb-2">
          Conteúdo
        </label>
        <div className="bg-dark-300 border border-dark-400 rounded-md mb-2">
          <div className="flex items-center p-2 border-b border-dark-400">
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="p-2 text-gray-400 hover:text-white"
              title="Negrito"
            >
              <div className="flex items-center justify-center">
                <FiBold />
              </div>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              className="p-2 text-gray-400 hover:text-white"
              title="Itálico"
            >
              <div className="flex items-center justify-center">
                <FiItalic />
              </div>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('[', '](https://exemplo.com)')}
              className="p-2 text-gray-400 hover:text-white"
              title="Link"
            >
              <div className="flex items-center justify-center">
                <FiLink />
              </div>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('- ')}
              className="p-2 text-gray-400 hover:text-white"
              title="Lista"
            >
              <div className="flex items-center justify-center">
                <FiList />
              </div>
            </button>
          </div>
          <textarea
            id="content"
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-dark-300 rounded-b-md px-4 py-2 text-white focus:outline-none min-h-[200px] whitespace-pre-wrap leading-tight"
            placeholder="Digite o conteúdo do anúncio (suporta markdown)"
            required
          />
        </div>
        <div className="flex items-center text-xs text-gray-400">
          <span className="inline-flex mr-1">
            <FiAlertCircle />
          </span>
          <span>O conteúdo suporta formatação Markdown.</span>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="imageUrl" className="block text-white font-medium mb-2">
          <span className="flex items-center">
            <span className="mr-2">
              <FiImage />
            </span>
            URL da Imagem Principal (opcional)
          </span>
        </label>
        <input
          type="url"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full bg-dark-300 border border-dark-400 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://exemplo.com/imagem.jpg"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="imageUrl2" className="block text-white font-medium mb-2">
          <span className="flex items-center">
            <span className="mr-2">
              <FiImage />
            </span>
            URL da Imagem Secundária (opcional)
          </span>
        </label>
        <input
          type="url"
          id="imageUrl2"
          value={imageUrl2}
          onChange={(e) => setImageUrl2(e.target.value)}
          className="w-full bg-dark-300 border border-dark-400 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://exemplo.com/imagem2.jpg"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="videoUrl" className="block text-white font-medium mb-2">
          <span className="flex items-center">
            <span className="mr-2">
              <FiVideo />
            </span>
            URL do Vídeo (opcional)
          </span>
        </label>
        <input
          type="url"
          id="videoUrl"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full bg-dark-300 border border-dark-400 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://youtube.com/embed/video-id"
        />
        <div className="flex items-center text-xs text-gray-400 mt-1">
          <span className="inline-flex mr-1">
            <FiAlertCircle />
          </span>
          <span>Use URLs de incorporação (embed) para vídeos do YouTube ou Vimeo.</span>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              setTitle(editingAnnouncement?.title || '');
              setContent(editingAnnouncement?.content || '');
              setImageUrl(editingAnnouncement?.imageUrl || '');
              setImageUrl2(editingAnnouncement?.imageUrl2 || '');
              setVideoUrl(editingAnnouncement?.videoUrl || '');
            }
          }}
          className="px-4 py-2 bg-dark-400 text-white rounded-md hover:bg-dark-300 transition-colors flex items-center"
          disabled={isSubmitting}
        >
          <span className="mr-2">
            <FiX />
          </span>
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors flex items-center"
          disabled={isSubmitting}
        >
          <span className="mr-2">
            <FiSave />
          </span>
          {isSubmitting ? 'Salvando...' : 'Salvar Anúncio'}
        </button>
      </div>
    </form>
  );
};

export default AnnouncementEditor;
