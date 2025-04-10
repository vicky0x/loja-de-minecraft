/**
 * Logger vazio para substituir chamadas existentes
 * Não faz nada em produção exceto para erros críticos
 */

const logger = {
  info: () => {},
  warn: () => {},
  error: (message: string, ...args: any[]) => {
    // Em produção, só logar erros críticos
    if (process.env.NODE_ENV === 'production') {
      if (message.includes('CRITICAL') || message.includes('FATAL')) {
        console.error(`[ERROR] ${message}`, ...args);
      }
    } else {
      // Em desenvolvimento, logar todos os erros
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  debug: () => {}
};

export default logger; 