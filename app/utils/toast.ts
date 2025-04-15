import toast, { Toast, ToastOptions } from 'react-hot-toast';

// Configurações padrão para todos os toasts
const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'bottom-center',
};

// Evitar duplicação de toasts em um curto período
const recentToasts = new Map<string, number>();
const TOAST_COOLDOWN = 2000; // 2 segundos

/**
 * Função para verificar se um toast similar foi exibido recentemente
 */
const isDuplicateToast = (message: string, type: string): boolean => {
  const key = `${type}-${message}`;
  const lastShown = recentToasts.get(key);
  const now = Date.now();
  
  if (lastShown && now - lastShown < TOAST_COOLDOWN) {
    return true;
  }
  
  recentToasts.set(key, now);
  // Limpar o registro após o período de cooldown
  setTimeout(() => {
    recentToasts.delete(key);
  }, TOAST_COOLDOWN);
  
  return false;
};

/**
 * Função para toast de sucesso
 */
export const showSuccess = (message: string, options?: ToastOptions): Toast => {
  if (isDuplicateToast(message, 'success')) return { id: 'duplicate' } as Toast;
  return toast.success(message, { ...defaultOptions, ...options });
};

/**
 * Função para toast de erro
 */
export const showError = (message: string, options?: ToastOptions): Toast => {
  if (isDuplicateToast(message, 'error')) return { id: 'duplicate' } as Toast;
  return toast.error(message, { ...defaultOptions, ...options });
};

/**
 * Função para toast de carregamento
 */
export const showLoading = (message: string, options?: ToastOptions): Toast => {
  if (isDuplicateToast(message, 'loading')) return { id: 'duplicate' } as Toast;
  return toast.loading(message, { ...defaultOptions, ...options });
};

/**
 * Função para toast customizado
 */
export const showCustom = (message: string, options?: ToastOptions): Toast => {
  if (isDuplicateToast(message, 'custom')) return { id: 'duplicate' } as Toast;
  return toast(message, { ...defaultOptions, ...options });
};

/**
 * Função para atualizar um toast existente
 */
export const updateToast = (
  id: string,
  message: string,
  type: 'success' | 'error' | 'loading' | 'custom',
  options?: ToastOptions
): Toast => {
  switch (type) {
    case 'success':
      return toast.success(message, { id, ...defaultOptions, ...options });
    case 'error':
      return toast.error(message, { id, ...defaultOptions, ...options });
    case 'loading':
      return toast.loading(message, { id, ...defaultOptions, ...options });
    default:
      return toast(message, { id, ...defaultOptions, ...options });
  }
};

/**
 * Função para descartar um toast
 */
export const dismissToast = (id?: string) => {
  if (id) {
    toast.dismiss(id);
  } else {
    toast.dismiss();
  }
};

// Exportar também a instância original do toast para casos especiais
export { toast };

// Exportar um objeto com todas as funções para facilitar o uso
export const toastUtils = {
  success: showSuccess,
  error: showError,
  loading: showLoading,
  custom: showCustom,
  update: updateToast,
  dismiss: dismissToast,
  toast
};

export default toastUtils; 