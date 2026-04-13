import { Component, inject, computed } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: false
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
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

  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
    { label: 'Atractivos', icon: 'pi pi-map-marker', routerLink: '/attractives' },
    { label: 'Restaurantes', icon: 'pi pi-shop', routerLink: '/restaurants' },
    { label: 'Comidas', icon: 'pi pi-inbox', routerLink: '/foods' },
    { label: 'Eventos', icon: 'pi pi-calendar', routerLink: '/events' },
    { label: 'Usuarios', icon: 'pi pi-users', routerLink: '/users' },
    { label: 'Logs', icon: 'pi pi-list', routerLink: '/logs' }
  ];

  logout() {
    this.authService.logout();
  }
}
