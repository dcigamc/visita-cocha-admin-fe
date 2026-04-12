import { Timestamp } from '@angular/fire/firestore';

export type Role = 'superadmin' | 'admin' | 'maintainer';

export interface ModulePermission {
  fullAccess: boolean;
  actions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  allowedIds?: string[];
}

export interface UserPermissions {
  attractives: ModulePermission;
  restaurants: ModulePermission;
  foods: ModulePermission;
  events: ModulePermission;
  users: ModulePermission;
  logs: ModulePermission;
}

export interface UserModel {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  permissions: UserPermissions;
}
