'use client';

/**
 * Polyfills para navegadores antigos
 * Este arquivo contém implementações alternativas de funcionalidades modernas 
 * para navegadores que não as suportam nativamente.
 */

// Flag para controlar se os polyfills já foram configurados
let polyfillsInitialized = false;

/**
 * Polyfill para AbortSignal.timeout
 * Implementa o método timeout no AbortSignal para navegadores antigos.
 * 
 * Uso:
 * const signal = AbortSignal.timeout(15000); // 15 segundos timeout
 */
export function setupAbortSignalTimeoutPolyfill() {
  if (typeof window !== 'undefined' && typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
    try {
      // Definir o método timeout no AbortSignal
      AbortSignal.timeout = function timeout(ms) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
      };
      
      console.debug('Polyfill AbortSignal.timeout aplicado com sucesso');
    } catch (error) {
      console.error('Erro ao aplicar polyfill para AbortSignal.timeout:', error);
    }
  }
}

/**
 * Função para inicializar todos os polyfills
 * Chame esta função no nível superior do seu app para garantir que os polyfills
 * sejam aplicados antes de qualquer código que dependa deles.
 */
export function setupPolyfills() {
  // Evitar inicialização múltipla
  if (polyfillsInitialized) {
    return;
  }
  
  try {
    // Configurar polyfills individuais
    setupAbortSignalTimeoutPolyfill();
    
    // Marcar como inicializado
    polyfillsInitialized = true;
    console.debug('Polyfills configurados com sucesso');
  } catch (error) {
    console.error('Erro ao configurar polyfills:', error);
  }
}

// Tentar aplicar os polyfills imediatamente se estivermos no cliente
if (typeof window !== 'undefined') {
  setupPolyfills();
}

// Exportar uma função padrão que configura todos os polyfills
export default setupPolyfills; 