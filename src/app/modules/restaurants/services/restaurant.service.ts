import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, serverTimestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../../core/services/firestore.service';
import { RestaurantModel } from '../../../core/models/restaurant.model';
import { CategoryModel } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private storage = inject(Storage);
  
  private collection = 'restaurants';
  private restaurantCategoriesCollection = 'restaurant-categories';
  private mainCategoriesCollection = 'main-categories';
  private foodsCollection = 'foods';

  /**
   * Genera un ID único para un nuevo restaurante.
   */
  generateId(): string {
    return doc(collection(this.firestore, this.collection)).id;
  }

  /**
   * Sube un archivo a Firebase Storage en la carpeta del restaurante.
   */
  async uploadFile(itemId: string, file: File, folder: 'cover' | 'gallery'): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, `${this.collection}/${itemId}/${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }

  /**
   * Elimina un archivo de Firebase Storage.
   */
  async deleteFileByUrl(url: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('Error deleting file from storage (might not exist):', error);
    }
  }

  /**
   * Obtiene todos los restaurantes.
   */
  getRestaurants(): Observable<RestaurantModel[]> {
    return this.firestoreService.getAll<RestaurantModel>(this.collection);
  }

  /**
   * Obtiene todas las categorías principales.
   */
  getMainCategories(): Observable<CategoryModel[]> {
    return this.firestoreService.getAll<CategoryModel>(this.mainCategoriesCollection);
  }

  /**
   * Obtiene todas las categorías de restaurantes.
   */
  getRestaurantCategories(): Observable<CategoryModel[]> {
    return this.firestoreService.getAll<CategoryModel>(this.restaurantCategoriesCollection);
  }

  /**
   * Obtiene todas las comidas.
   */
  getFoods(): Observable<any[]> {
    return this.firestoreService.getAll<any>(this.foodsCollection);
  }

  /**
   * Obtiene un restaurante por su ID.
   */
  getRestaurantById(id: string): Observable<RestaurantModel> {
    return this.firestoreService.getById<RestaurantModel>(this.collection, id);
  }

  /**
   * Crea un nuevo restaurante.
   */
  async createRestaurant(data: Omit<RestaurantModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const user = this.authService.currentUser();
    const restaurant: Omit<RestaurantModel, 'id'> = {
      ...data,
      createdBy: user?.uid || 'unknown',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isActive: true
    };
    return this.firestoreService.create(this.collection, restaurant, data.name);
  }

  /**
   * Actualiza un restaurante.
   */
  async updateRestaurant(id: string, data: Partial<RestaurantModel>): Promise<void> {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp() as any
    };
    return this.firestoreService.update(this.collection, id, updateData, (data as any).name);
  }

  /**
   * Elimina un restaurante.
   */
  async deleteRestaurant(id: string, name: string): Promise<void> {
    return this.firestoreService.delete(this.collection, id, name);
  }
}
