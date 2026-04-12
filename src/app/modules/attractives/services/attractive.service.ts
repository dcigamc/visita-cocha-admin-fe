import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AttractiveModel } from '../../../core/models/attractive.model';
import { AuthService } from '../../../core/services/auth.service';
import { serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttractiveService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private collection = 'attractives';

  /**
   * Obtiene todos los atractivos.
   */
  getAttractives(): Observable<AttractiveModel[]> {
    return this.firestoreService.getAll<AttractiveModel>(this.collection);
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
    return this.firestoreService.delete(this.collection, id, name);
  }
}
