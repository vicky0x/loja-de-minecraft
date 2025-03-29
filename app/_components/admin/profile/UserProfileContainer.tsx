import React, { useEffect, useState } from 'react';

function UserProfileContainer() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar perfil');
        }
        
        const data = await response.json();
        setUser(data.user);
        
        // Verificar se user existe e tem role antes de determinar isAdmin
        setIsAdmin(data.user && data.user.role === 'admin');
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        setError('Não foi possível carregar os dados do usuário');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  return (
    <div>
      {/* Renderização do componente com base no estado */}
    </div>
  );
}

export default UserProfileContainer; 