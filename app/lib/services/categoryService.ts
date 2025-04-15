import { EventEmitter } from 'events';

// Interface para representar uma categoria
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

// Classe para gerenciar categorias e notificar sobre alterações
class CategoryService {
  private static instance: CategoryService;
  private categories: Category[] = [];
  private eventEmitter = new EventEmitter();
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

  private constructor() {
    // Singleton
  }

  // Obter a instância singleton do serviço
  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // Buscar todas as categorias
  public async getCategories(forceRefresh = false): Promise<Category[]> {
    const now = Date.now();
    const shouldRefresh = forceRefresh || 
      this.categories.length === 0 || 
      (now - this.lastFetchTime) > this.CACHE_DURATION;

    if (shouldRefresh) {
      try {
        const response = await fetch('/api/categories', {
          cache: 'no-store',
          next: { revalidate: 0 }
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar categorias');
        }

        const data = await response.json();
        this.categories = data.categories || [];
        this.lastFetchTime = now;
        
        // Notificar os ouvintes sobre a atualização
        this.eventEmitter.emit('categoriesUpdated', this.categories);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        // Em caso de erro, retornar as categorias em cache se existirem
        if (this.categories.length === 0) {
          throw error;
        }
      }
    }

    return [...this.categories];
  }

  // Atualizar o cache de categorias após uma operação de criação/atualização/exclusão
  public updateCategories(categories: Category[]): void {
    this.categories = categories;
    this.lastFetchTime = Date.now();
    this.eventEmitter.emit('categoriesUpdated', this.categories);
  }

  // Registrar uma função de callback para ser notificada quando as categorias forem atualizadas
  public onCategoriesUpdated(callback: (categories: Category[]) => void): void {
    this.eventEmitter.on('categoriesUpdated', callback);
  }

  // Remover um ouvinte
  public offCategoriesUpdated(callback: (categories: Category[]) => void): void {
    this.eventEmitter.off('categoriesUpdated', callback);
  }
}

export default CategoryService.getInstance(); 