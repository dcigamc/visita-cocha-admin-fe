import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  QueryConstraint,
  getDoc
} from '@angular/fire/firestore';
import { Observable, from, firstValueFrom } from 'rxjs';
import { LogService } from './log.service';
import { LogModule } from '../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private logService = inject(LogService);

  /**
   * Obtiene todos los documentos de una colección con filtros opcionales.
   */
  getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    const colRef = collection(this.firestore, collectionName);
    const q = query(colRef, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  /**
   * Obtiene un documento por su ID.
   */
  getById<T>(collectionName: string, id: string): Observable<T> {
    const docRef = doc(this.firestore, `${collectionName}/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<T>;
  }

  /**
   * Crea un nuevo documento y registra el log.
   */
  async create<T>(collectionName: string, data: T, targetName?: string): Promise<string> {
    const colRef = collection(this.firestore, collectionName);
    const docRef = await addDoc(colRef, data as any);
    
    await this.logService.logAction({
      action: 'CREATE',
      module: collectionName as LogModule,
      targetId: docRef.id,
      targetName: targetName || collectionName,
      newData: data
    });

    return docRef.id;
  }

  /**
   * Actualiza un documento existente y registra el log con diff.
   */
  async update<T>(collectionName: string, id: string, data: Partial<T>, targetName?: string): Promise<void> {
    const docRef = doc(this.firestore, `${collectionName}/${id}`);
    
    // Obtenemos los datos anteriores para el log
    const prevSnap = await getDoc(docRef);
    const previousData = prevSnap.data();

    await updateDoc(docRef, data as any);

    await this.logService.logAction({
      action: 'UPDATE',
      module: collectionName as LogModule,
      targetId: id,
      targetName: targetName || collectionName,
      previousData,
      newData: data
    });
  }

  /**
   * Elimina un documento y registra el log.
   */
  async delete(collectionName: string, id: string, targetName?: string): Promise<void> {
    const docRef = doc(this.firestore, `${collectionName}/${id}`);
    
    // Obtenemos los datos para el log antes de borrar
    const prevSnap = await getDoc(docRef);
    const previousData = prevSnap.data();

    await deleteDoc(docRef);

    await this.logService.logAction({
      action: 'DELETE',
      module: collectionName as LogModule,
      targetId: id,
      targetName: targetName || collectionName,
      previousData
    });
  }
}
