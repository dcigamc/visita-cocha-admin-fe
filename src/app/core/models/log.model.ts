import { Timestamp } from '@angular/fire/firestore';

export type LogAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHANGE';
export type LogModule = 'attractives' | 'restaurants' | 'foods' | 'events' | 'users' | 'logs' | 'auth';

export interface LogModel {
  id?: string;
  userId: string | any;
  userEmail?: string | any;
  userRole: string | any;
  action: LogAction;
  module: LogModule;
  targetId?: string | any;
  targetName?: string;
  previousData?: any;
  newData?: any;
  metadata: {
    ip?: string;
    userAgent?: string;
    timestamp: Timestamp;
  };
}
