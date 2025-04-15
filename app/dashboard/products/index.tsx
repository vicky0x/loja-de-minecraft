/**
 * Este arquivo exporta funções específicas do módulo de produtos
 * para serem acessíveis a partir de um único ponto de entrada.
 */

// Importamos a função de armazenamento global
import { fetchAssignments as globalFetchAssignments } from '@/app/lib/store';

/**
 * Função fetchAssignments que chama a implementação global
 * Isso garante que mesmo se importada de múltiplos lugares, sempre será a mesma função
 */
export const fetchAssignments = async (page: number = 1): Promise<void> => {
  return globalFetchAssignments(page);
};

// Exportação padrão para compatibilidade
export default { fetchAssignments }; 