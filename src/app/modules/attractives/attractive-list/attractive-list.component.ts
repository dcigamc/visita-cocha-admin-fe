import { Component, inject, signal } from '@angular/core';
import { AttractiveService } from '../services/attractive.service';
import { AttractiveModel } from '../../../core/models/attractive.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-attractive-list',
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-slate-800">Atractivos Turísticos</h1>
        <p-button 
          label="Crear Atractivo" 
          icon="pi pi-plus" 
          (onClick)="create()" 
          *hasPermission="'attractives:create'"
        ></p-button>
      </div>

      <p-table 
        [value]="attractives() || []" 
        [paginator]="true" 
        [rows]="10" 
        responsiveLayout="stack"
        class="shadow-sm"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Ubicación</th>
            <th class="w-24">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
            <td>
              <img [src]="item.images[0] || 'assets/placeholder.png'" class="w-16 h-12 object-cover rounded shadow-sm" alt="">
            </td>
            <td class="font-semibold text-slate-700">{{item.name}}</td>
            <td>
              <span class="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100 uppercase font-bold">
                {{item.category}}
              </span>
            </td>
            <td class="text-sm text-slate-600">{{item.location.address}}</td>
            <td class="flex gap-2">
              <p-button 
                icon="pi pi-pencil" 
                severity="info" 
                size="small" 
                (onClick)="edit(item.id)"
                *hasPermission="'attractives:update'"
              ></p-button>
              <p-button 
                icon="pi pi-trash" 
                severity="danger" 
                size="small" 
                (onClick)="delete(item)"
                *hasPermission="'attractives:delete'"
              ></p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
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
