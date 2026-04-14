import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AttractiveModel } from '../../../core/models/attractive.model';
import { CategoryModel } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { serverTimestamp, collection, doc, where, QueryConstraint } from '@angular/fire/firestore';
import { Observable, of, throwError } from 'rxjs';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class AttractiveService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private storage = inject(Storage);
  private collection = 'attractions';
  private mainCategoriesCollection = 'main-categories';
  private attractionsCategoriesCollection = 'attraction-categories';
  private foodsCollection = 'foods';

  /**
   * Obtiene todos los atractivos permitidos para el usuario actual.
   */
  getAttractives(): Observable<AttractiveModel[]> {
    const user = this.authService.currentUser();
    if (!user) return of([]);

    const constraints: QueryConstraint[] = [];

    if (user.role !== 'superadmin') {
      const perms = user.permissions?.attractives;
      if (perms && !perms.fullAccess) {
        if (perms.allowedIds && perms.allowedIds.length > 0) {
          constraints.push(where('__name__', 'in', perms.allowedIds));
        } else {
          return of([]);
        }
      }
    }

    return this.firestoreService.getAll<AttractiveModel>(this.collection, constraints);
  }

  /**
   * Genera un ID único para un nuevo atractivo.
   */
  generateId(): string {
    return doc(collection(this.firestoreService['firestore'], this.collection)).id;
  }

  /**
   * Sube un archivo a Firebase Storage en la carpeta del atractivo.
   */
  async uploadFile(itemId: string, file: File, folder: 'cover' | 'gallery'): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, `attractions/${itemId}/${folder}/${fileName}`);
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
   * Obtiene todas las categorías principales.
   */
  getMainCategories(): Observable<CategoryModel[]> {
    return this.firestoreService.getAll<CategoryModel>(this.mainCategoriesCollection);
  }

  /**
   * Obtiene todas las categorías de atractivos.
   */
  getAttractionCategories(): Observable<CategoryModel[]> {
    return this.firestoreService.getAll<CategoryModel>(this.attractionsCategoriesCollection);
  }

  /**
   * Obtiene todas las comidas.
   */
  getFoods(): Observable<any[]> {
    return this.firestoreService.getAll<any>(this.foodsCollection);
  }

  /**
   * Obtiene un atractivo por su ID.
   */
  getAttractiveById(id: string): Observable<AttractiveModel> {
    return this.firestoreService.getById<AttractiveModel>(this.collection, id);
  }

  /**
   * Crea un nuevo atractivo.
   */
  async createAttractive(data: Omit<AttractiveModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const user = this.authService.currentUser();
    const attractive: Omit<AttractiveModel, 'id'> = {
      ...data,
      createdBy: user?.uid || 'unknown',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isActive: true
    };
    return this.firestoreService.create(this.collection, attractive, data.name);
  }

  /**
   * Actualiza un atractivo.
   */
  async updateAttractive(id: string, data: Partial<AttractiveModel>): Promise<void> {
    if (!this.permissionService.isAllowedDocument('attractives', id)) {
      throw new Error('Acceso denegado para actualizar este documento');
    }
    const updateData = {
      ...data,
      updatedAt: serverTimestamp() as any
    };
    return this.firestoreService.update(this.collection, id, updateData, (data as any).name);
  }

  /**
   * Elimina un atractivo.
   */
  async deleteAttractive(id: string, name: string): Promise<void> {
    if (!this.permissionService.isAllowedDocument('attractives', id)) {
      throw new Error('Acceso denegado para eliminar este documento');
    }
    return this.firestoreService.delete(this.collection, id, name);
  }
}
