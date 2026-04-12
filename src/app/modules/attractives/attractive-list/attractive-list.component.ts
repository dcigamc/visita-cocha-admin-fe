import { Component, inject, signal } from '@angular/core';
import { AttractiveService } from '../services/attractive.service';
import { AttractiveModel } from '../../../core/models/attractive.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-attractive-list',
  templateUrl: './attractive-list.component.html',
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
export class AttractiveListComponent {
  private attractiveService = inject(AttractiveService);
  private router = inject(Router);

  attractives = toSignal(this.attractiveService.getAttractives());

  create() {
    this.router.navigate(['/attractives/new']);
  }

  edit(id: string) {
    this.router.navigate(['/attractives/edit', id]);
  }

  delete(item: AttractiveModel) {
    if (confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      this.attractiveService.deleteAttractive(item.id!, item.name);
    }
  }
}
