import { Component, inject, signal } from '@angular/core';
import { RestaurantService } from '../services/restaurant.service';
import { RestaurantModel } from '../../../core/models/restaurant.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-restaurant-list',
  templateUrl: './restaurant-list.component.html',
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
    :host ::ng-deep .p-inputtext {
      border-radius: 0.5rem;
    }
  `],
  standalone: false
})
export class RestaurantListComponent {
  private restaurantService = inject(RestaurantService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  restaurants = toSignal(this.restaurantService.getRestaurants());

  // Detail Modal State
  displayDetailModal = signal(false);
  selectedRestaurant = signal<RestaurantModel | null>(null);

  create() {
    this.router.navigate(['/restaurants/new']);
  }

  edit(item: RestaurantModel) {
    if (item.id) {
      this.router.navigate(['/restaurants/edit', item.id]);
    }
  }

  showDetail(item: RestaurantModel) {
    this.selectedRestaurant.set(item);
    this.displayDetailModal.set(true);
  }

  copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Copiado', 
        detail: 'Descripción copiada al portapapeles',
        life: 2000
      });
    });
  }

  delete(item: RestaurantModel) {
    if (confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      this.restaurantService.deleteRestaurant(item.id!, item.name);
    }
  }
}
