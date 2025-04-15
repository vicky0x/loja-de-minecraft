'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSave, FiX, FiImage, FiVideo, FiAlertCircle, FiBold, FiItalic, FiLink, FiList, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface EditingAnnouncement {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
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
  const [videoUrl, setVideoUrl] = useState(editingAnnouncement?.videoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalizar quebras de linha quando o componente carrega um anúncio existente
  useEffect(() => {
    if (editingAnnouncement?.content) {
      const normalizedContent = editingAnnouncement.content
        .replace(/\n\n&nbsp;\n\n/g, '\n\n')
        .replace(/\n{3,}/g, '\n\n');
      setContent(normalizedContent);
    }
  }, [editingAnnouncement]);

  // Adicionar esta função para extrair o ID do vídeo do YouTube
  const extractYouTubeId = (url: string): string => {
    // Se já for um ID simples (sem URL)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    
    // Se for uma URL completa, extrair o ID
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  // Modificar o handleSubmit para converter o ID em URL de incorporação
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
      
      // Processar URL do vídeo se houver
      let processedVideoUrl = '';
      if (videoUrl.trim()) {
        const videoId = extractYouTubeId(videoUrl.trim());
        if (videoId) {
          processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Debugging: verificar os valores antes de enviar
      console.log('Enviando requisição com dados:', {
        title,
        content: formattedContent,
        imageUrl,
        videoUrl: processedVideoUrl
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
          videoUrl: processedVideoUrl || undefined,
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

  // Função para lidar com upload de imagens
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    console.log(`Inicializando upload de imagem: ${file.name}`);
    
    // Validar o tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      console.error(`Tipo de arquivo inválido: ${file.type}`);
      return;
    }
    
    // Validar o tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      console.error(`Tamanho de arquivo excedido: ${file.size} bytes`);
      return;
    }
    
    try {
      // Indicar que está carregando
      setIsUploading(true);
      console.log('Definido estado de carregamento para imagem');
      
      // Criar um formData para enviar o arquivo
      const formData = new FormData();
      formData.append('files', file);
      formData.append('type', 'announcements');
      
      console.log(`FormData criado: arquivo=${file.name}, tipo=${file.type}, tamanho=${file.size}`);
      
      const toastId = toast.loading(`Fazendo upload da imagem: ${file.name}...`);
      console.log('Iniciando upload da imagem:', file.name, file.type, file.size);
      
      // Usar o endpoint de upload existente
      console.log('Enviando requisição para /api/upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Resposta do servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error(`Erro do servidor: ${response.status} ${response.statusText}`);
        toast.dismiss(toastId);
        
        let errorMessage = 'Erro ao fazer upload da imagem';
        try {
          const errorData = await response.json();
          console.error('Dados do erro:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Erro ao analisar resposta de erro como JSON:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Se chegou aqui, a resposta foi bem-sucedida
      let data;
      try {
        data = await response.json();
        console.log('Dados da resposta:', data);
      } catch (parseError) {
        console.error('Erro ao analisar resposta como JSON:', parseError);
        toast.dismiss(toastId);
        throw new Error('Erro ao processar resposta do servidor');
      }
      
      if (data.paths && data.paths.length > 0) {
        // Atualizar a URL da imagem com o caminho retornado pela API
        const imageUrl = data.paths[0];
        console.log('URL da imagem recebida:', imageUrl);
        
        setImageUrl(imageUrl);
        console.log('Imagem atualizada:', imageUrl);
        
        toast.success('Imagem carregada com sucesso', { id: toastId });
      } else {
        toast.dismiss(toastId);
        console.error('Nenhum caminho retornado do servidor', data);
        throw new Error('Nenhum caminho de imagem retornado pelo servidor');
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(typeof error === 'object' && error !== null 
        ? error.message || 'Erro ao fazer upload da imagem' 
        : 'Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
      console.log('Estado de carregamento da imagem definido como falso');
    }
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
        <label htmlFor="imageUpload" className="block text-white font-medium mb-2">
          <span className="flex items-center">
            <span className="mr-2">
              <FiImage />
            </span>
            Imagem (opcional)
          </span>
        </label>
        
        <div>
          <div className="flex items-center">
            <input
              type="file"
              id="imageUpload"
              ref={fileInputRef}
              onChange={(e) => handleImageUpload(e.target.files?.[0] as File)}
              className="hidden"
              accept="image/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-br from-dark-400 to-dark-300 border border-dark-400 rounded-md px-4 py-3 text-white hover:from-dark-300 hover:to-dark-200 focus:outline-none flex items-center justify-center transition-all duration-200"
              disabled={isUploading}
            >
              <FiUpload className="mr-2" />
              {isUploading ? 'Carregando...' : 'Carregar imagem do dispositivo'}
            </button>
          </div>
        </div>
        
        {imageUrl && (
          <div className="mt-2 bg-dark-300 p-2 rounded-md">
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-auto max-h-60 object-contain mx-auto rounded-lg"
                onError={(e) => {
                  console.error('Erro ao carregar imagem:', imageUrl);
                  e.currentTarget.style.display = 'none';
                  toast.error('Erro ao carregar a imagem. Tente fazer o upload novamente.');
                }}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-400/60">
                  <span className="text-white">Carregando...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <label htmlFor="videoUrl" className="block text-white font-medium mb-2">
          <span className="flex items-center">
            <span className="mr-2">
              <FiVideo />
            </span>
            ID ou URL do Vídeo do YouTube (opcional)
          </span>
        </label>
        <input
          type="text"
          id="videoUrl"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full bg-dark-300 border border-dark-400 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ex: dQw4w9WgXcQ ou https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        />
        <div className="flex items-center text-xs text-gray-400 mt-1">
          <span className="inline-flex mr-1">
            <FiAlertCircle />
          </span>
          <span>Você pode inserir o ID do vídeo do YouTube (11 caracteres) ou a URL completa do vídeo.</span>
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
