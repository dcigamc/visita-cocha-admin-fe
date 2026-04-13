import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, serverTimestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../../core/services/firestore.service';
import { UserModel } from '../../../core/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestoreService = inject(FirestoreService);
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
   * Actualiza el perfil completo de un usuario.
   */
  async updateUser(uid: string, data: Partial<UserModel>, displayName: string): Promise<void> {
    return this.firestoreService.update(this.collection, uid, {
      ...data,
      updatedAt: serverTimestamp() as any
    }, displayName);
  }

  /**
   * Actualiza el estado de un usuario (activo/inactivo).
   */
  async toggleUserStatus(uid: string, isActive: boolean, displayName: string): Promise<void> {
    return this.firestoreService.update(this.collection, uid, { 
      isActive, 
      updatedAt: serverTimestamp() as any 
    }, displayName);
  }

  /**
   * Elimina un usuario (lógicamente o físicamente, aquí físicamente para cumplir con FirestoreService).
   */
  async deleteUser(uid: string, displayName: string): Promise<void> {
    return this.firestoreService.delete(this.collection, uid, displayName);
  }
}
