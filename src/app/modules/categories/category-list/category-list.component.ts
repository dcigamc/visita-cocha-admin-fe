import { Component, inject, signal, computed, effect } from '@angular/core';
import { CategoryService, CategoryType } from '../services/category.service';
import { CategoryModel } from '../../../core/models/category.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  standalone: false
})
export class CategoryListComponent {
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);

  categoryTypes = [
    { label: 'Principales', value: 'main-categories' },
    { label: 'Atractivos', value: 'attraction-categories' },
    { label: 'Restaurantes', value: 'restaurant-categories' },
    { label: 'Eventos', value: 'event-categories' },
    { label: 'Hoteles', value: 'hotel-categories' }
  ];

  selectedType = signal<CategoryType>('main-categories');
  
  categories = signal<CategoryModel[]>([]);
  isLoading = signal(false);

  // Form Modal State
  displayFormModal = signal(false);
  categoryToEdit = signal<CategoryModel | null>(null);

  constructor() {
    effect(() => {
      this.loadCategories(this.selectedType());
    });
  }

  loadCategories(type: CategoryType) {
    this.isLoading.set(true);
    this.categoryService.getCategories(type).subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las categorías' });
        this.isLoading.set(false);
      }
    });
  }

  create() {
    this.categoryToEdit.set(null);
    this.displayFormModal.set(true);
  }

  edit(item: CategoryModel) {
    this.categoryToEdit.set(item);
    this.displayFormModal.set(true);
  }

  async delete(item: CategoryModel) {
    if (confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      try {
        await this.categoryService.deleteCategory(this.selectedType(), item.id, item.name);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría eliminada' });
      } catch (error: any) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo eliminar' });
      }
    }
  }

  onSave() {
    this.displayFormModal.set(false);
    this.loadCategories(this.selectedType());
  }
}
