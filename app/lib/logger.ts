/**
 * Módulo de logger simples para a aplicação
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const logger = {
  /**
   * Loga uma mensagem de informação
   */
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  
  /**
   * Loga uma mensagem de aviso
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  /**
   * Loga uma mensagem de erro
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
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

export default logger; 