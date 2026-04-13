import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="p-8 space-y-8">
      @if (authService.isLoading()) {
        <div class="flex items-center gap-2">
          <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
          <span class="text-slate-600 font-medium">Cargando dashboard...</span>
        </div>
      } @else {
        <!-- Welcome Section -->
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div class="relative z-10">
            <h1 class="text-4xl font-bold text-slate-800">¡Hola, {{ user()?.displayName || 'Bienvenido' }}!</h1>
            <p class="text-slate-500 mt-2 text-lg">Bienvenido al panel administrativo de Visita Cocha.</p>
          </div>
          <!-- Decorative Background Icon -->
          <i class="pi pi-map-marker absolute -right-4 -bottom-4 text-9xl text-slate-50 opacity-[0.03] rotate-12"></i>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Attractives Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i class="pi pi-map text-xl"></i>
              </div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Atractivos</span>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-slate-800">{{ attractivesCount() || 0 }}</span>
              <span class="text-sm text-slate-500 mt-1">Registrados</span>
            </div>
          </div>

          <!-- Restaurants Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <i class="pi pi-shop text-xl"></i>
              </div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Restaurantes</span>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-slate-800">{{ restaurantsCount() || 0 }}</span>
              <span class="text-sm text-slate-500 mt-1">Establecimientos</span>
            </div>
          </div>

          <!-- Foods Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <i class="pi pi-heart-fill text-xl"></i>
              </div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Comidas</span>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-slate-800">{{ foodsCount() || 0 }}</span>
              <span class="text-sm text-slate-500 mt-1">Platos típicos</span>
            </div>
          </div>

          <!-- Events Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <i class="pi pi-calendar text-xl"></i>
              </div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Eventos</span>
            </div>
            <div class="flex flex-col">
              <span class="text-3xl font-bold text-slate-800">{{ eventsCount() || 0 }}</span>
              <span class="text-sm text-slate-500 mt-1">Activos</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  standalone: false
})
export class DashboardComponent {
  public authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  
  user = this.authService.currentUser;

  attractivesCount = toSignal(this.firestoreService.getAll('attractions').pipe(map(list => list.length)));
  restaurantsCount = toSignal(this.firestoreService.getAll('restaurants').pipe(map(list => list.length)));
  foodsCount = toSignal(this.firestoreService.getAll('foods').pipe(map(list => list.length)));
  eventsCount = toSignal(this.firestoreService.getAll('announcements').pipe(map(list => list.length)));
}
