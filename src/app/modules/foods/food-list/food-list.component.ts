import { Component, inject, signal } from '@angular/core';
import { FoodService } from '../services/food.service';
import { FoodModel } from '../../../core/models/food.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-food-list',
  templateUrl: './food-list.component.html',
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
export class FoodListComponent {
  private foodService = inject(FoodService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  foods = toSignal(this.foodService.getFoods());

  // Detail Modal State
  displayDetailModal = signal(false);
  selectedFood = signal<FoodModel | null>(null);

  create() {
    this.router.navigate(['/foods/new']);
  }

  edit(item: FoodModel) {
    if (item.id) {
      this.router.navigate(['/foods/edit', item.id]);
    }
  }

  showDetail(item: FoodModel) {
    this.selectedFood.set(item);
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

  delete(item: FoodModel) {
    if (confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      this.foodService.deleteFood(item.id!, item.name);
    }
  }
}
