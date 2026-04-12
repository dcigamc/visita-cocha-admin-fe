import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { LogAction, LogModule, LogModel } from '../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  /**
   * Registra una acción de auditoría en Firestore.
   */
  async logAction(params: {
    action: LogAction;
    module: LogModule;
    targetId?: string;
    targetName?: string;
    previousData?: any;
    newData?: any;
  }): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return; // Si no hay usuario, no registramos el log

    const log: LogModel = {
      userId: user.uid,
      userEmail: user.email,
      userRole: user.role,
      action: params.action,
      module: params.module,
      targetId: params.targetId,
      targetName: params.targetName,
      previousData: params.previousData || null,
      newData: params.newData || null,
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp() as Timestamp
      }
    };

    try {
      const logsRef = collection(this.firestore, 'logs');
      await addDoc(logsRef, log);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Registra logs específicos de autenticación (Login/Logout).
   */
  async logAuth(action: 'LOGIN' | 'LOGOUT'): Promise<void> {
    await this.logAction({
      action,
      module: 'auth'
    });
  }
}
