import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  QueryConstraint,
  getDoc,
  onSnapshot
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
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
   * Usa onSnapshot directamente para evitar errores de tipo internos de AngularFire.
   */
  getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    return new Observable<T[]>(subscriber => {
      const colRef = collection(this.firestore, collectionName);
      const q = query(colRef, ...constraints);
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as T));
          subscriber.next(items);
        },
        (error) => {
          console.error(`Error in getAll (${collectionName}):`, error);
          subscriber.error(error);
        }
      );
      
      return () => unsubscribe();
    });
  }

  /**
   * Obtiene un documento por su ID.
   */
  getById<T>(collectionName: string, id: string): Observable<T> {
    return new Observable<T>(subscriber => {
      const docRef = doc(this.firestore, `${collectionName}/${id}`);
      
      const unsubscribe = onSnapshot(docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next({ id: snapshot.id, ...snapshot.data() } as T);
          } else {
            subscriber.next(null as any);
          }
        },
        (error) => {
          console.error(`Error in getById (${collectionName}/${id}):`, error);
          subscriber.error(error);
        }
      );

      return () => unsubscribe();
    });
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
