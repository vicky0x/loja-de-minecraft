/**
 * Módulo para gerenciamento da conexão com Redis e funções relacionadas
 * 
 * Este módulo implementa a integração com Redis para armazenamento persistente
 * de tokens revogados, permitindo que o sistema de autenticação mantenha o 
 * controle de tokens inválidos mesmo após reinicializações do servidor.
 * 
 * Em ambiente de produção, o Redis é obrigatório.
 * Em desenvolvimento, há fallback para armazenamento em memória.
 * 
 * Configuração através de variáveis de ambiente:
 * - REDIS_URL: URL completa de conexão (prioritária)
 * - REDIS_HOST: Hostname do servidor Redis
 * - REDIS_PORT: Porta do servidor Redis
 * - REDIS_PASSWORD: Senha para autenticação (opcional)
 */

import logger from './logger';

// Configurações do Redis
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Namespace para tokens revogados
const REVOKED_TOKENS_PREFIX = 'revoked_tokens:';

// Mapa para armazenar tokens revogados em memória (para desenvolvimento/fallback)
const localRevokedTokens = new Map<string, number>();

// Cliente Redis - será inicializado conforme necessário
let redisClient: any = null;

/**
 * Inicializa a conexão com Redis
 * No ambiente Next.js, só podemos usar o Redis no lado do servidor
 */
export async function initRedis(): Promise<any> {
  // Verificar se estamos no lado do servidor
  if (typeof window !== 'undefined') {
    logger.warn('Tentativa de inicializar Redis no cliente - ignorando');
    return null;
  }

  // Retornar cliente existente se já inicializado
  if (redisClient) {
    return redisClient;
  }

  try {
    // Importação dinâmica para evitar problemas com o módulo 'dns' no lado do cliente
    const { Redis } = await import('ioredis');

    // Usar URL se disponível, caso contrário conectar usando host/port
    if (REDIS_URL) {
      redisClient = new Redis(REDIS_URL);
      logger.info('Conectando ao Redis via URL');
    } else {
      const options: any = {
        host: REDIS_HOST,
        port: REDIS_PORT,
        retryStrategy: (times: number) => {
          return Math.min(times * 100, 3000);
        },
      };

      if (REDIS_PASSWORD) {
        options.password = REDIS_PASSWORD;
      }

      redisClient = new Redis(options);
      logger.info(`Conectando ao Redis em ${REDIS_HOST}:${REDIS_PORT}`);
    }

    // Testar conexão
    await redisClient.ping();
    logger.info('Conexão com Redis estabelecida com sucesso');

    // Configurar tratamento de erro
    redisClient.on('error', (err: any) => {
      logger.error('Erro na conexão com Redis:', err);
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Reconectando ao Redis...');
    });

    return redisClient;
  } catch (error) {
    logger.error('Falha ao conectar com Redis:', error);
    
    // Fallback para modo sem Redis (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('IMPORTANTE: Usando modo sem Redis (apenas para desenvolvimento)');
      return null;
    }
    
    throw error;
  }
}

/**
 * Obtém cliente Redis, inicializando se necessário
 */
export async function getRedisClient(): Promise<any> {
  // Verificar se estamos no lado do servidor
  if (typeof window !== 'undefined') {
    logger.debug('Tentativa de usar Redis no cliente - usando modo de memória local');
    return null;
  }
  
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

/**
 * Verifica se um token está revogado
 * @param token Token JWT ou identificador do token
 * @returns Boolean indicando se o token está revogado
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  try {
    // Extrair apenas os primeiros 10 caracteres para usar como ID
    const tokenId = token.substring(0, 10);
    const key = `${REVOKED_TOKENS_PREFIX}${tokenId}`;
    
    // Verificar se estamos no lado do cliente
    if (typeof window !== 'undefined') {
      // Usar armazenamento em memória local no cliente
      return localRevokedTokens.has(tokenId);
    }
    
    const redis = await getRedisClient();
    
    // Se Redis não estiver disponível, verificar no armazenamento em memória
    if (!redis) {
      logger.warn('Redis não disponível para verificar token revogado, usando memória');
      return localRevokedTokens.has(tokenId);
    }
    
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Erro ao verificar token revogado:', error);
    
    // Em caso de erro, permitir o token
    return false;
  }
}

/**
 * Adiciona um token à lista de revogados
 * @param token Token JWT ou identificador
 * @param expiryInSeconds Tempo em segundos até expirar
 */
export async function revokeToken(token: string, expiryInSeconds: number = 60 * 60 * 24 * 7): Promise<void> {
  try {
    // Extrair apenas os primeiros 10 caracteres para usar como ID
    const tokenId = token.substring(0, 10);
    const key = `${REVOKED_TOKENS_PREFIX}${tokenId}`;
    
    // Verificar se estamos no lado do cliente
    if (typeof window !== 'undefined') {
      // Usar armazenamento em memória local no cliente
      const expiryTime = Date.now() + (expiryInSeconds * 1000);
      localRevokedTokens.set(tokenId, expiryTime);
      logger.debug(`Token ${tokenId} revogado localmente (client-side)`);
      return;
    }
    
    const redis = await getRedisClient();
    
    // Se Redis não estiver disponível, usar armazenamento em memória
    if (!redis) {
      logger.warn('Redis não disponível para revogar token, usando memória');
      const expiryTime = Date.now() + (expiryInSeconds * 1000);
      localRevokedTokens.set(tokenId, expiryTime);
      return;
    }
    
    // Adicionar à lista de revogados com tempo de expiração
    await redis.set(key, '1');
    await redis.expire(key, expiryInSeconds);
    
    logger.debug(`Token ${tokenId} revogado por ${expiryInSeconds} segundos`);
  } catch (error) {
    logger.error('Erro ao revogar token:', error);
    
    // Em caso de erro, tentar usar armazenamento em memória
    try {
      const tokenId = token.substring(0, 10);
      const expiryTime = Date.now() + (expiryInSeconds * 1000);
      localRevokedTokens.set(tokenId, expiryTime);
      logger.debug('Token revogado em memória após falha no Redis');
    } catch (fallbackError) {
      logger.error('Falha completa ao revogar token:', fallbackError);
    }
  }
}

/**
 * Remove tokens revogados expirados
 * @returns Número de tokens removidos
 */
export async function cleanupRevokedTokens(): Promise<number> {
  // Limpar tokens em memória
  const now = Date.now();
  let count = 0;
  
  localRevokedTokens.forEach((expiry, key) => {
    if (now > expiry) {
      localRevokedTokens.delete(key);
      count++;
    }
  });
  
  if (count > 0) {
    logger.debug(`Removidos ${count} tokens expirados da memória local`);
  }
  
  return count;
}

// Executar limpeza periódica de tokens na memória local
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRevokedTokens, 60 * 60 * 1000); // Limpar a cada hora
}

export default {
  getRedisClient,
  initRedis,
  isTokenRevoked,
  revokeToken,
  cleanupRevokedTokens
}; 