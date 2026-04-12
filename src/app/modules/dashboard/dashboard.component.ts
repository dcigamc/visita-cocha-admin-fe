import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="p-8">
      @if (authService.isLoading()) {
        <div class="flex items-center gap-2">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
          <span>Cargando perfil...</span>
        </div>
      } @else {
        <h1 class="text-2xl font-bold">Dashboard - Bienvenido, {{ user()?.displayName || 'Usuario' }}</h1>
        <p class="text-slate-600 mt-2">Rol: <span class="font-semibold text-primary">{{ user()?.role || 'Sin Rol' }}</span></p>
        
        <div class="mt-8 flex gap-4">
          <p-button label="Cerrar Sesión" icon="pi pi-sign-out" (onClick)="logout()" severity="danger"></p-button>
        </div>
      }
    </div>
  `,
  standalone: false
})
export class DashboardComponent {
  public authService = inject(AuthService);
  user = this.authService.currentUser;

  logout() {
    this.authService.logout();
  }
}
