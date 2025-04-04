'use client';

import { useState, useEffect } from 'react';

// Verificar se o localStorage está disponível
const isLocalStorageAvailable = () => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export function useLocalCache<T = any>(key: string, initialValue: T, expirationMinutes: number = 60) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  // Carregar do cache ao montar o componente
  useEffect(() => {
    // Não carregar se estiver no meio de um redirecionamento
    try {
      const redirectStatus = localStorage.getItem('auth_redirect_triggered');
      if (redirectStatus === 'multiple') {
        console.log('Redirecionamento em andamento, ignorando carregamento de cache');
        return;
      }
    } catch (e) {
      // Ignorar erro
    }
    
    loadFromCache();
  }, [key]);

  // Função para carregar do cache
  const loadFromCache = () => {
    try {
      if (!isLocalStorageAvailable()) {
        setLoaded(true);
        return;
      }
      
      const item = localStorage.getItem(key);
      
      if (item) {
        try {
          const cached = JSON.parse(item);
          
          // Verificar expiração
          if (isValid(cached)) {
            setValue(cached.value);
          } else {
            // Remover item expirado
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.warn(`Erro ao processar cache para ${key}:`, e);
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn(`Erro ao acessar cache para ${key}:`, e);
    } finally {
      setLoaded(true);
    }
  };

  // Função para atualizar o valor e salvar no cache
  const updateValue = (newValue: T) => {
    setValue(newValue);
    
    try {
      if (!isLocalStorageAvailable()) {
        return;
      }
      
      const now = new Date();
      const expiration = new Date(now.getTime() + expirationMinutes * 60 * 1000);
      
      const item = {
        value: newValue,
        expiration: expiration.toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn(`Erro ao salvar no cache para ${key}:`, e);
    }
  };

  // Função para limpar o cache
  const clearCache = () => {
    setValue(initialValue);
    
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Erro ao limpar cache para ${key}:`, e);
    }
  };

  // Verificar se o cache ainda é válido
  const isValid = (cachedItem: any) => {
    if (!cachedItem || !cachedItem.expiration) {
      return false;
    }
    
    const expiration = new Date(cachedItem.expiration);
    return expiration > new Date();
  };

  return { value, setValue: updateValue, loaded, clearCache };
} 