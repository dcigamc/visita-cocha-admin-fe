import { Component, inject, signal } from '@angular/core';
import { UserService } from '../services/user.service';
import { UserModel, Role } from '../../../core/models/user.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PermissionService } from '../../../core/services/permission.service';
import { AuthService } from '../../../core/services/auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styles: [`
    :host ::ng-deep .p-datatable .p-datatable-header {
      background: white;
      border: none;
      padding: 1.25rem;
    }
    :host ::ng-deep .p-datatable .p-paginator {
      border: none;
      padding: 1rem;
      background: #f8fafc;
    }
  `],
  standalone: false
})
export class UserListComponent {
  private userService = inject(UserService);
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  currentUser = this.authService.currentUser;

  users = toSignal(
    this.userService.getUsers().pipe(
      map(users => {
        const currentUser = this.currentUser();
        if (!currentUser) return [];

        return users.filter(u => {
          // No mostrarse a sí mismo
          if (u.uid === currentUser.uid) return false;

          // Si es SuperAdmin, ve a todos los demás
          if (currentUser.role === 'superadmin') return true;

          // Si es Admin, solo ve a los Maintainers
          if (currentUser.role === 'admin') {
            return u.role === 'maintainer';
          }

          // Otros roles (Maintainer) por defecto no ven a nadie o solo a su nivel si se permitiera
          return false;
        });
      })
    )
  );

  // Edit Modal State
  displayEditModal = signal(false);
  selectedUser = signal<UserModel | null>(null);

  canUpdateUsers() {
    return this.permissionService.hasPermission('users', 'update');
  }

  isSuperAdmin() {
    return this.currentUser()?.role === 'superadmin';
  }

  create() {
    this.selectedUser.set(null);
    this.displayEditModal.set(true);
  }

  edit(user: UserModel) {
    this.selectedUser.set(user);
    this.displayEditModal.set(true);
  }


  async toggleStatus(user: UserModel) {
    try {
      await this.userService.toggleUserStatus(user.uid, !user.isActive, user.displayName);
      this.messageService.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: `Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el estado del usuario'
      });
    }
  }

  getRoleLabel(role: Role): string {
    const roles: Record<Role, string> = {
      'superadmin': 'Super Administrador',
      'admin': 'Administrador',
      'maintainer': 'Mantenimiento'
    };
    return roles[role] || role;
  }

  getRoleSeverity(role: Role): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'admin': return 'info';
      case 'maintainer': return 'success';
      default: return 'secondary';
    }
  }

  delete(user: UserModel) {
    if (confirm(`¿Estás seguro de eliminar al usuario "${user.displayName}"?`)) {
      this.userService.deleteUser(user.uid, user.displayName);
    }
  }
}
