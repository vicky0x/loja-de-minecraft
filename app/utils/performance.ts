/**
 * Utilitários para otimização de desempenho
 */

/**
 * Divide um componente ou operação pesada em chunks menores para evitar 
 * bloqueio da thread principal
 * 
 * @param items - Array de itens a processar
 * @param chunkSize - Tamanho de cada chunk (default: 5)
 * @param processor - Função de processamento para cada item
 */
export function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  chunkSize: number = 5
): Promise<void> {
  return new Promise((resolve) => {
    if (!items.length) {
      resolve();
      return;
    }

    const chunks = splitIntoChunks(items, chunkSize);
    let currentChunk = 0;

    const processChunk = () => {
      if (currentChunk >= chunks.length) {
        resolve();
        return;
      }

      const chunk = chunks[currentChunk];
      chunk.forEach((item, idx) => {
        const originalIndex = currentChunk * chunkSize + idx;
        processor(item, originalIndex);
      });

      currentChunk++;
      setTimeout(processChunk, 0); // Ceder para o browser antes de processar o próximo chunk
    };

    processChunk();
  });
}

/**
 * Divide um array em chunks de tamanho especificado
 */
function splitIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Atrasa a execução de funções não críticas
 * 
 * @param fn - Função a ser executada
 * @param delay - Atraso em milissegundos
 */
export function deferExecution(fn: () => void, delay: number = 500): void {
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        setTimeout(fn, delay);
      });
    } else {
      setTimeout(fn, delay);
    }
  }
}

/**
 * Verifica se a página está visível para o usuário
 */
export function isPageVisible(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible';
}

/**
 * Executa uma função apenas quando a página estiver visível
 * 
 * @param fn - Função a ser executada
 */
export function executeWhenVisible(fn: () => void): () => void {
  if (typeof document === 'undefined') {
    fn();
    return () => {};
  }

  if (document.visibilityState === 'visible') {
    fn();
    return () => {};
  }

  const handler = () => {
    if (document.visibilityState === 'visible') {
      fn();
      document.removeEventListener('visibilitychange', handler);
    }
  };

  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
} 