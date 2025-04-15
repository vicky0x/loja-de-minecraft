import { initRedis } from '@/app/lib/redis';
import logger from '@/app/lib/logger';

/**
 * Inicializa o Redis para uso nas API routes
 * Esta função deve ser chamada no início das API routes que precisam gerenciar
 * tokens revogados ou outras funcionalidades do Redis
 */
export async function setupRedis(): Promise<void> {
  // Apenas em ambiente de produção
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  
  try {
    await initRedis();
    logger.debug('Redis inicializado para API routes');
  } catch (error) {
    logger.error('Erro ao inicializar Redis na API:', error);
  }
}

// Inicializar por padrão se este arquivo for importado
setupRedis().catch(error => {
  logger.error('Falha na inicialização automática do Redis:', error);
}); 