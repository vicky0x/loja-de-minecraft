import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina e otimiza classes usando clsx e tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata preço para exibição
 */
export function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',')
}

/**
 * Formata nome do produto para exibição
 */
export function formatProductName(name: string): string {
  return name.replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Formata data para exibição
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formata hora para exibição
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Trunca texto com ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Gera ID único simples
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Aplica máscara a um valor (ex: CPF, telefone)
 */
export function applyMask(value: string, mask: string): string {
  let result = ''
  let index = 0
  
  for (let i = 0; i < mask.length && index < value.length; i++) {
    if (mask[i] === '#') {
      result += value[index]
      index++
    } else {
      result += mask[i]
    }
  }
  
  return result
} 