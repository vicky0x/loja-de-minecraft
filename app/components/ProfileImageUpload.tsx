import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit } from 'react-icons/fi';
import Image from 'next/image';

interface ProfileImageUploadProps {
  currentImage?: string;
  onUploadSuccess: (imageUrl: string) => void;
  userName?: string;
}

export function ProfileImageUpload({ 
  currentImage, 
  onUploadSuccess,
  userName
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error("O arquivo deve ser uma imagem (JPG, PNG ou GIF)");
      return;
    }

    // Verificar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    try {
      setIsUploading(true);
      
      // Mostrar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Preparar para upload
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Garantir que a URL da imagem seja absoluta
        const imageUrl = data.imageUrl;
        
        onUploadSuccess(imageUrl);
        
        // Criar e disparar um evento personalizado com as estatísticas atualizadas
        if (data.userData && data.userData.stats) {
          try {
            // Salvar as estatísticas no localStorage para sincronização
            localStorage.setItem('userStats', JSON.stringify(data.userData.stats));
            
            console.log('Disparando evento com as estatísticas atualizadas:', data.userData.stats);
            
            const event = new CustomEvent('profile-image-updated', {
              detail: {
                imageUrl: imageUrl,
                userStats: data.userData.stats
              }
            });
            
            window.dispatchEvent(event);
          } catch (error) {
            console.error('Erro ao processar estatísticas do usuário:', error);
          }
        }
        
        toast.success("Imagem de perfil atualizada com sucesso");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao enviar imagem');
        // Remover o preview
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="relative w-20 h-20 rounded-full overflow-hidden bg-dark-300 cursor-pointer group"
      onClick={handleImageClick}
    >
      {(previewImage || currentImage) ? (
        <Image 
          src={previewImage || currentImage || '#'} 
          alt={userName || 'Avatar'} 
          fill
          className="object-cover"
          onError={(e) => {
            console.log('Erro ao carregar imagem de perfil');
            e.currentTarget.style.display = 'none';
            // Mostrar a primeira letra do nome do usuário como fallback
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary-dark/30">
                <span class="text-white text-xl font-bold">${userName?.charAt(0).toUpperCase() || 'U'}</span>
              </div>`;
            }
          }}
          unoptimized={true}
          priority={true}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-primary text-xl font-bold bg-gradient-to-br from-primary/30 to-primary-dark/30">
          {userName?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
      
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <FiEdit className="text-white w-5 h-5" />
      </div>
      
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
} 