/**
 * Módulo de logger simples para a aplicação
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Controle de log throttling por tipo de mensagem
const logThrottles: Record<string, { lastTime: number, count: number }> = {};
const LOG_THROTTLE_MS = 5000; // Tempo mínimo entre logs duplicados (5 segundos)
const LOG_BUFFER_SIZE = 10;   // Número máximo de logs idênticos acumulados antes de mostrar

const logger = {
  /**
   * Loga uma mensagem de informação
   */
  info: (message: string, ...args: any[]) => {
    // Em produção, não mostrar logs de info
    if (process.env.NODE_ENV !== 'production') {
      // Aplicar throttling para evitar flood de logs
      if (!shouldLog('info', message)) return;
      
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  /**
   * Loga uma mensagem de aviso
   */
  warn: (message: string, ...args: any[]) => {
    // Em produção, mostrar apenas avisos importantes
    if (process.env.NODE_ENV !== 'production' || message.includes('IMPORTANTE') || message.includes('CRITICAL')) {
      // Aplicar throttling para evitar flood de logs
      if (!shouldLog('warn', message)) return;
      
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  /**
   * Loga uma mensagem de erro
   */
  error: (message: string, ...args: any[]) => {
    // Sanitizar possíveis credenciais antes de logar
    const safeMessage = sanitizeCredentials(message);
    const safeArgs = args.map(arg => 
      typeof arg === 'string' ? sanitizeCredentials(arg) : arg
    );
    
    // Aplicar throttling para erros repetidos
    if (!shouldLog('error', safeMessage)) return;
    
    console.error(`[ERROR] ${safeMessage}`, ...safeArgs);
  },
  
  /**
   * Loga uma mensagem de debug
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      // Aplicar throttling para evitar flood de logs
      if (!shouldLog('debug', message)) return;
      
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

/**
 * Determina se uma mensagem deve ser logada com base em throttling
 * Limita mensagens repetidas no intervalo de tempo definido
 */
function shouldLog(level: LogLevel, message: string): boolean {
  const key = `${level}:${message}`;
  const now = Date.now();
  
  // Se é a primeira vez que vemos esta mensagem
  if (!logThrottles[key]) {
    logThrottles[key] = { lastTime: now, count: 1 };
    return true;
  }
  
  const throttleInfo = logThrottles[key];
  
  // Se passou o tempo de throttling, resetar contador e permitir
  if (now - throttleInfo.lastTime > LOG_THROTTLE_MS) {
    // Se houve mensagens suprimidas, mostrar contador
    if (throttleInfo.count > 1) {
      console.log(`[LOG] Mensagem "${message}" repetida ${throttleInfo.count - 1} vezes nos últimos ${LOG_THROTTLE_MS/1000}s`);
    }
    
    throttleInfo.lastTime = now;
    throttleInfo.count = 1;
    return true;
  }
  
  // Incrementar contador de mensagens suprimidas
  throttleInfo.count++;
  
  // Permitir logs periódicos mesmo dentro do período de throttling
  // se atingir o tamanho do buffer
  if (throttleInfo.count >= LOG_BUFFER_SIZE) {
    throttleInfo.lastTime = now;
    throttleInfo.count = 0;
    return true;
  }
  
  return false;
}

/**
 * Sanitiza credenciais em strings para evitar vazamento de informações sensíveis
 */
function sanitizeCredentials(text: string): string {
  if (typeof text !== 'string') return text;
  
  // Sanitizar URLs de MongoDB
  text = text.replace(/mongodb(\+srv)?:\/\/[^:]+:([^@]+)@/g, 'mongodb$1://[USER]:[PASSWORD]@');
  
  // Sanitizar tokens JWT
  text = text.replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[JWT_TOKEN]');
  
  // Sanitizar tokens do Mercado Pago
  text = text.replace(/APP_USR-[a-zA-Z0-9-]{10,}/g, '[MP_TOKEN]');
  
  // Sanitizar outras credenciais comuns
  text = text.replace(/senha|password|secret|apikey|api_key|token/i, (match) => `[${match.toUpperCase()}]`);
  
  return text;
}

export default logger; 