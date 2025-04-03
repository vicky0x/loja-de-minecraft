/**
 * Armazenamento global para funções e utilitários compartilhados em toda a aplicação
 */

/**
 * Função fetchAssignments vazia para prevenir erros de referência não definida
 * Esta função é chamada em várias partes da aplicação e precisa estar disponível
 * globalmente para evitar erros de cliente.
 * 
 * @param page Número da página (padrão: 1)
 * @returns Promise vazia
 */
export const fetchAssignments = async (page: number = 1): Promise<void> => {
  try {
    console.warn('fetchAssignments chamado do store global, página:', page);
    return Promise.resolve();
  } catch (error) {
    console.error('Erro em fetchAssignments global:', error);
    return Promise.resolve();
  }
};

// Exportação padrão para compatibilidade com diferentes formas de importação
export default {
  fetchAssignments
}; 