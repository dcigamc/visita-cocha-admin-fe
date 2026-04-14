import { Component, inject, computed } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { UserPermissions } from '../../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: false
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  user = this.authService.currentUser;

  userRoleLabel = computed(() => {
    const role = this.user()?.role;
    switch (role) {
      case 'superadmin': return 'Super Administrador';
      case 'admin': return 'Administrador';
      case 'maintainer': return 'Mantenimiento';
      default: return role || 'Usuario';
    }
  });

  menuItems = computed(() => {
    const items = [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard', module: null },
      { label: 'Atractivos', icon: 'pi pi-map-marker', routerLink: '/attractives', module: 'attractives' },
      { label: 'Restaurantes', icon: 'pi pi-shop', routerLink: '/restaurants', module: 'restaurants' },
      { label: 'Comidas', icon: 'pi pi-inbox', routerLink: '/foods', module: 'foods' },
      { label: 'Eventos', icon: 'pi pi-calendar', routerLink: '/events', module: 'events' },
      { label: 'Categorías', icon: 'pi pi-tags', routerLink: '/categories', module: 'categories' },
      { label: 'Usuarios', icon: 'pi pi-users', routerLink: '/users', module: 'users' },
      { label: 'Logs', icon: 'pi pi-list', routerLink: '/logs', module: 'logs' }
    ];

    return items.filter(item => {
      if (!item.module) return true;
      return this.permissionService.hasPermission(item.module as keyof UserPermissions, 'read');
    });
  });

  logout() {
    this.authService.logout();
  }
}
