/**
 * Utilitários para tratamento de erros
 */

/**
 * Formata um erro para ser exibido em logs
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * Função segura para converter qualquer valor para string
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  try {
    if (typeof value === 'object') {
      if ('toString' in value && typeof value.toString === 'function') {
        return value.toString();
      }
      return JSON.stringify(value);
    }
    return String(value);
  } catch (error) {
    return '[Erro ao converter para string]';
  }
}

/**
 * Função segura para verificar se um valor é um array
 */
export function safeIsArray(value: unknown): boolean {
  return Array.isArray(value);
}

/**
 * Função segura para obter o comprimento de um array
 */
export function safeArrayLength(arr: unknown): number {
  if (Array.isArray(arr)) {
    return arr.length;
  }
  return 0;
}

/**
 * Função segura para converter um valor para número
 */
export function safeToNumber(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  return 0;
}

/**
 * Função para tratar erros em componentes React
 */
export function logComponentError(componentName: string, error: unknown): void {
  console.error(`Erro no componente ${componentName}:`, formatError(error));
}

export default {
  formatError,
  safeToString,
  safeIsArray,
  safeArrayLength,
  safeToNumber,
  logComponentError
}; 