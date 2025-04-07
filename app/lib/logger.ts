/**
 * Módulo de logger simples para a aplicação
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const logger = {
  /**
   * Loga uma mensagem de informação
   */
  info: (message: string, ...args: any[]) => {
    // Em produção, não mostrar logs de info
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  /**
   * Loga uma mensagem de aviso
   */
  warn: (message: string, ...args: any[]) => {
    // Em produção, mostrar apenas avisos importantes
    if (process.env.NODE_ENV !== 'production' || message.includes('IMPORTANTE') || message.includes('CRITICAL')) {
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
    
    console.error(`[ERROR] ${safeMessage}`, ...safeArgs);
  },
  
  /**
   * Loga uma mensagem de debug
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

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