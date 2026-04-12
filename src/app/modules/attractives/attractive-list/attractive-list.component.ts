import { Component, inject, signal } from '@angular/core';
import { AttractiveService } from '../services/attractive.service';
import { AttractiveModel } from '../../../core/models/attractive.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

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
  private messageService = inject(MessageService);

  attractives = toSignal(this.attractiveService.getAttractives());

  // Detail Modal State
  displayDetailModal = signal(false);
  selectedAttractive = signal<AttractiveModel | null>(null);

  create() {
    this.router.navigate(['/attractives/new']);
  }

  edit(id: string) {
    this.router.navigate(['/attractives/edit', id]);
  }

  showDetail(item: AttractiveModel) {
    this.selectedAttractive.set(item);
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

  delete(item: AttractiveModel) {
    if (confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      this.attractiveService.deleteAttractive(item.id!, item.name);
    }
  }
}
