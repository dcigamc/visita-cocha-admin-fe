import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { CategoryModel } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { serverTimestamp, QueryConstraint } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

export type CategoryType = 'main-categories' | 'attraction-categories' | 'restaurant-categories';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  /**
   * Obtiene categorías de una colección específica.
   */
  getCategories(type: CategoryType): Observable<CategoryModel[]> {
    const user = this.authService.currentUser();
    if (!user) return of([]);

    const constraints: QueryConstraint[] = [];
    // Las categorías suelen ser gestionadas solo por admins, 
    // pero si un mantenedor tuviera acceso, se aplicaría filtrado aquí si fuera necesario.
    
    return this.firestoreService.getAll<CategoryModel>(type, constraints);
  }

  /**
   * Obtiene una categoría por ID.
   */
  getCategoryById(type: CategoryType, id: string): Observable<CategoryModel> {
    return this.firestoreService.getById<CategoryModel>(type, id);
  }

  /**
   * Crea una nueva categoría.
   */
  async createCategory(type: CategoryType, data: Omit<CategoryModel, 'id'>): Promise<string> {
    const category = {
      ...data,
      available: data.available ?? true
    };
    return this.firestoreService.create(type, category, data.name);
  }

  /**
   * Actualiza una categoría.
   */
  async updateCategory(type: CategoryType, id: string, data: Partial<CategoryModel>): Promise<void> {
    return this.firestoreService.update(type, id, data, (data as any).name);
  }

  /**
   * Elimina una categoría.
   */
  async deleteCategory(type: CategoryType, id: string, name: string): Promise<void> {
    return this.firestoreService.delete(type, id, name);
  }
}
