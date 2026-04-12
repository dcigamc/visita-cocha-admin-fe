import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserPermissions, Role } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private authService = inject(AuthService);

  /**
   * Verifica si el usuario actual tiene permiso para una acción específica en un módulo.
   * SuperAdmin siempre tiene permiso.
   */
  hasPermission(module: keyof UserPermissions, action: 'create' | 'read' | 'update' | 'delete'): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;

    // El SuperAdmin tiene acceso total a todo
    if (user.role === 'superadmin') return true;

    const modulePerm = user.permissions[module];
    if (!modulePerm) return false;

    // Si tiene acceso total al módulo
    if (modulePerm.fullAccess) return true;

    // Si no, verificamos la acción específica
    return modulePerm.actions[action];
  }

  /**
   * Verifica si el usuario tiene acceso total a un módulo.
   */
  hasFullAccess(module: keyof UserPermissions): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'superadmin') return true;

    return user.permissions[module]?.fullAccess || false;
  }

  /**
   * Verifica si el usuario tiene permiso para un documento específico dentro de un módulo.
   */
  isAllowedDocument(module: keyof UserPermissions, docId: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'superadmin') return true;

    const modulePerm = user.permissions[module];
    if (!modulePerm) return false;

    if (modulePerm.fullAccess) return true;

    return modulePerm.allowedIds?.includes(docId) || false;
  }

  /**
   * Verifica si el usuario actual puede crear un usuario con el rol objetivo.
   * Regla:
   * SuperAdmin -> puede crear cualquier rol.
   * Admin -> solo puede crear Mantenedor.
   * Mantenedor -> no puede crear usuarios.
   */
  canCreateRole(targetRole: Role): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;

    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && targetRole === 'maintainer') return true;

    return false;
  }
}
