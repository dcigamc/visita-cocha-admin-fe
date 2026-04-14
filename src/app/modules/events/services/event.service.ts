import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, serverTimestamp, where, QueryConstraint } from '@angular/fire/firestore';
import { FirestoreService } from '../../../core/services/firestore.service';
import { EventModel } from '../../../core/models/event.model';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Observable, of, throwError } from 'rxjs';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private storage = inject(Storage);
  
  private collection = 'announcements';
  private foodsCollection = 'foods';
  private restaurantsCollection = 'restaurants';
  private attractivesCollection = 'attractions';

  /**
   * Obtiene todos los eventos permitidos para el usuario actual.
   */
  getEvents(): Observable<EventModel[]> {
    const user = this.authService.currentUser();
    if (!user) return of([]);

    const constraints: QueryConstraint[] = [];

    if (user.role !== 'superadmin') {
      const perms = user.permissions?.events;
      if (perms && !perms.fullAccess) {
        if (perms.allowedIds && perms.allowedIds.length > 0) {
          constraints.push(where('__name__', 'in', perms.allowedIds));
        } else {
          return of([]);
        }
      }
    }

    return this.firestoreService.getAll<EventModel>(this.collection, constraints);
  }

  /**
   * Genera un ID único para un nuevo evento.
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
   * Obtiene todas las comidas.
   */
  getFoods(): Observable<any[]> {
    return this.firestoreService.getAll<any>(this.foodsCollection);
  }

  /**
   * Obtiene todos los restaurantes.
   */
  getRestaurants(): Observable<any[]> {
    return this.firestoreService.getAll<any>(this.restaurantsCollection);
  }

  /**
   * Obtiene todos los atractivos.
   */
  getAttractives(): Observable<any[]> {
    return this.firestoreService.getAll<any>(this.attractivesCollection);
  }

  /**
   * Obtiene un evento por su ID.
   */
  getEventById(id: string): Observable<EventModel> {
    return this.firestoreService.getById<EventModel>(this.collection, id);
  }

  /**
   * Crea un nuevo evento.
   */
  async createEvent(data: Omit<EventModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const user = this.authService.currentUser();
    const event: Omit<EventModel, 'id'> = {
      ...data,
      createdBy: user?.uid || 'unknown',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isActive: true
    };
    return this.firestoreService.create(this.collection, event, data.title);
  }

  /**
   * Actualiza un evento.
   */
  async updateEvent(id: string, data: Partial<EventModel>): Promise<void> {
    if (!this.permissionService.isAllowedDocument('events', id)) {
      throw new Error('Acceso denegado para actualizar este documento');
    }
    const updateData = {
      ...data,
      updatedAt: serverTimestamp() as any
    };
    return this.firestoreService.update(this.collection, id, updateData, (data as any).title);
  }

  /**
   * Elimina un evento.
   */
  async deleteEvent(id: string, title: string): Promise<void> {
    if (!this.permissionService.isAllowedDocument('events', id)) {
      throw new Error('Acceso denegado para eliminar este documento');
    }
    return this.firestoreService.delete(this.collection, id, title);
  }
}
