import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  inject, 
  effect 
} from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { UserPermissions } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

/**
 * Directiva estructural para mostrar/ocultar elementos basados en permisos.
 * Uso: <button *hasPermission="'atractivos:create'">Crear</button>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: false
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  private module?: keyof UserPermissions;
  private action?: 'create' | 'read' | 'update' | 'delete';
  private isVisible = false;

  @Input() set hasPermission(permissionStr: string) {
    if (permissionStr) {
      const parts = permissionStr.split(':');
      if (parts.length === 2) {
        this.module = parts[0] as keyof UserPermissions;
        this.action = parts[1] as 'create' | 'read' | 'update' | 'delete';
        this.updateView();
      }
    }
  }

  constructor() {
    // Escuchar cambios en el usuario actual de forma reactiva
    effect(() => {
      this.authService.currentUser();
      this.updateView();
    });
  }

  private updateView() {
    if (!this.module || !this.action) {
      this.clearView();
      return;
    }

    const hasAccess = this.permissionService.hasPermission(this.module, this.action);

    if (hasAccess && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasAccess && this.isVisible) {
      this.clearView();
    }
  }

  private clearView() {
    this.viewContainer.clear();
    this.isVisible = false;
  }
}
