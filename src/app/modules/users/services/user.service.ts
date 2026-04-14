import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, serverTimestamp } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FirestoreService } from '../../../core/services/firestore.service';
import { UserModel } from '../../../core/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestoreService = inject(FirestoreService);
  private functions = inject(Functions);
  private collection = 'users';

  /**
   * Obtiene todos los usuarios.
   */
  getUsers(): Observable<UserModel[]> {
    return this.firestoreService.getAll<UserModel>(this.collection);
  }

  /**
   * Obtiene un usuario por su UID.
   */
  getUserById(uid: string): Observable<UserModel> {
    return this.firestoreService.getById<UserModel>(this.collection, uid);
  }

  /**
   * Crea un nuevo usuario mediante Cloud Functions (Admin SDK).
   */
  async createUser(userData: any): Promise<any> {
    const createUserFn = httpsCallable(this.functions, 'createUser');
    return createUserFn(userData);
  }

  /**
   * Actualiza el perfil completo de un usuario.
   */
  async updateUser(uid: string, data: Partial<UserModel>, displayName: string): Promise<void> {
    return this.firestoreService.update(this.collection, uid, {
      ...data,
      updatedAt: serverTimestamp() as any
    }, displayName);
  }

  /**
   * Actualiza el estado de un usuario (activo/inactivo) en Auth y Firestore.
   */
  async toggleUserStatus(uid: string, isActive: boolean, displayName: string): Promise<any> {
    const toggleFn = httpsCallable(this.functions, 'toggleUserStatusAuth');
    return toggleFn({ uid, isActive, displayName });
  }

  /**
   * Elimina un usuario físicamente de Firestore.
   * Nota: En lugar de borrarlo, ahora es preferible usar toggleUserStatus para deshabilitarlo.
   */
  async deleteUser(uid: string, displayName: string): Promise<void> {
    return this.firestoreService.delete(this.collection, uid, displayName);
  }
}
