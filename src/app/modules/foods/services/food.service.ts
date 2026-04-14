import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, serverTimestamp, where, QueryConstraint } from '@angular/fire/firestore';
import { FirestoreService } from '../../../core/services/firestore.service';
import { FoodModel } from '../../../core/models/food.model';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Observable, of, throwError } from 'rxjs';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private storage = inject(Storage);
  
  private collection = 'foods';

  /**
   * Obtiene todas las comidas permitidas para el usuario actual.
   */
  getFoods(): Observable<FoodModel[]> {
    const user = this.authService.currentUser();
    if (!user) return of([]);

    const constraints: QueryConstraint[] = [];

    if (user.role !== 'superadmin') {
      const perms = user.permissions?.foods;
      if (perms && !perms.fullAccess) {
        if (perms.allowedIds && perms.allowedIds.length > 0) {
          constraints.push(where('__name__', 'in', perms.allowedIds));
        } else {
          return of([]);
        }
      }
    }

    return this.firestoreService.getAll<FoodModel>(this.collection, constraints);
  }

  /**
   * Genera un ID único para una nueva comida.
   */
  generateId(): string {
    return doc(collection(this.firestore, this.collection)).id;
  }

  /**
   * Sube un archivo a Firebase Storage.
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
   * Obtiene una comida por su ID.
   */
  getFoodById(id: string): Observable<FoodModel> {
    return this.firestoreService.getById<FoodModel>(this.collection, id);
  }

  /**
   * Crea una nueva comida.
   */
  async createFood(data: Omit<FoodModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const user = this.authService.currentUser();
    const food: Omit<FoodModel, 'id'> = {
      ...data,
      createdBy: user?.uid || 'unknown',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isActive: true
    };
    return this.firestoreService.create(this.collection, food, data.name);
  }

  /**
   * Actualiza una comida.
   */
  async updateFood(id: string, data: Partial<FoodModel>): Promise<void> {
    if (!this.permissionService.isAllowedDocument('foods', id)) {
      throw new Error('Acceso denegado para actualizar este documento');
    }
    const updateData = {
      ...data,
      updatedAt: serverTimestamp() as any
    };
    return this.firestoreService.update(this.collection, id, updateData, (data as any).name);
  }

  /**
   * Elimina una comida.
   */
  async deleteFood(id: string, name: string): Promise<void> {
    if (!this.permissionService.isAllowedDocument('foods', id)) {
      throw new Error('Acceso denegado para eliminar este documento');
    }
    return this.firestoreService.delete(this.collection, id, name);
  }
}
