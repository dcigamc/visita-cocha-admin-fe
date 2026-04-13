import { Component, inject, signal } from '@angular/core';
import { LogService } from '../../../core/services/log.service';
import { LogModel } from '../../../core/models/log.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-log-list',
  templateUrl: './log-list.component.html',
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
export class LogListComponent {
  private logService = inject(LogService);

  logs = toSignal(this.logService.getLogs());

  // Detail Modal State
  displayDetailModal = signal(false);
  selectedLog = signal<LogModel | null>(null);

  showDetail(item: LogModel) {
    this.selectedLog.set(item);
    this.displayDetailModal.set(true);
  }

  getActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'LOGIN': return 'success';
      case 'LOGOUT': return 'secondary';
      default: return 'secondary';
    }
  }

  getActionLabel(action: string): string {
    const actions: Record<string, string> = {
      'CREATE': 'Creación',
      'UPDATE': 'Actualización',
      'DELETE': 'Eliminación',
      'LOGIN': 'Inicio de Sesión',
      'LOGOUT': 'Cierre de Sesión',
      'READ': 'Lectura',
      'PERMISSION_CHANGE': 'Cambio de Permisos'
    };
    return actions[action] || action;
  }

  getModuleLabel(module: string): string {
    const modules: Record<string, string> = {
      'attractions': 'Atractivos',
      'restaurants': 'Restaurantes',
      'foods': 'Comidas',
      'events': 'Eventos',
      'announcements': 'Eventos',
      'users': 'Usuarios',
      'logs': 'Logs',
      'auth': 'Autenticación'
    };
    return modules[module] || module;
  }
}
