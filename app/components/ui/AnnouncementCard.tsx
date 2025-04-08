{/* Componente de imagem */}
      {announcement.imageUrl && (
        <div className="mb-4 overflow-hidden rounded-lg relative">
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="w-full h-auto object-contain rounded-lg border border-dark-400"
            style={{ maxHeight: '300px' }}
            onError={(e) => {
              console.error('Erro ao carregar imagem do anúncio:', announcement.imageUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )} 