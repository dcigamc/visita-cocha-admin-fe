import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
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
   * El id de Firebase siempre sobrescribe cualquier campo 'id' interno.
   */
  getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    return new Observable<T[]>(subscriber => {
      const colRef = collection(this.firestore, collectionName);
      const q = query(colRef, ...constraints);
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
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
            subscriber.next({ ...snapshot.data(), id: snapshot.id } as T);
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
   * Crea un nuevo documento. 
   * Si data.id existe, usa setDoc para mantenerlo. Si no, usa addDoc.
   */
  async create<T>(collectionName: string, data: T, targetName?: string): Promise<string> {
    const colRef = collection(this.firestore, collectionName);
    const { id, ...cleanData } = data as any;
    
    let finalId: string;

    if (id) {
      // Si ya viene con ID, respetamos ese ID y usamos setDoc
      const docRef = doc(this.firestore, `${collectionName}/${id}`);
      await setDoc(docRef, cleanData);
      finalId = id;
    } else {
      // Si no trae ID, dejamos que Firebase genere uno aleatorio
      const docRef = await addDoc(colRef, cleanData);
      finalId = docRef.id;
    }
    
    await this.logService.logAction({
      action: 'CREATE',
      module: collectionName as LogModule,
      targetId: finalId,
      targetName: targetName || collectionName,
      newData: cleanData
    });

    return finalId;
  }

  /**
   * Actualiza un documento existente y registra el log con diff.
   */
  async update<T>(collectionName: string, id: string, data: Partial<T>, targetName?: string): Promise<void> {
    const docRef = doc(this.firestore, `${collectionName}/${id}`);
    
    // Limpiamos el ID si existe en la data para no guardarlo como campo
    const { id: _, ...cleanData } = data as any;

    // Obtenemos los datos anteriores para el log
    const prevSnap = await getDoc(docRef);
    const previousData = prevSnap.data();

    await updateDoc(docRef, cleanData);

    await this.logService.logAction({
      action: 'UPDATE',
      module: collectionName as LogModule,
      targetId: id,
      targetName: targetName || collectionName,
      previousData,
      newData: cleanData
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
