import { Component, inject, signal } from '@angular/core';
import { EventService } from '../services/event.service';
import { EventModel } from '../../../core/models/event.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
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
export class EventListComponent {
  private eventService = inject(EventService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  events = toSignal(this.eventService.getEvents());

  // Detail Modal State
  displayDetailModal = signal(false);
  selectedEvent = signal<EventModel | null>(null);

  create() {
    this.router.navigate(['/events/new']);
  }

  edit(id: string) {
    this.router.navigate(['/events/edit', id]);
  }

  showDetail(item: EventModel) {
    this.selectedEvent.set(item);
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

  delete(item: EventModel) {
    if (confirm(`¿Estás seguro de eliminar "${item.title}"?`)) {
      this.eventService.deleteEvent(item.id!, item.title);
    }
  }
}
