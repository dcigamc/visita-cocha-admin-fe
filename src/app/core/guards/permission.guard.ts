import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { UserPermissions } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, skip, take } from 'rxjs';

/**
 * Guard funcional que verifica permisos específicos por módulo y acción.
 * Espera `module` y `action` en la data de la ruta.
 */
export const permissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const module = route.data['module'] as keyof UserPermissions;
  const action = (route.data['action'] as 'create' | 'read' | 'update' | 'delete') || 'read';

  // Esperamos a que el Signal del usuario tenga datos (ya que se carga desde Firestore)
  return toObservable(authService.currentUser).pipe(
    filter(user => user !== undefined), // Filtrar el estado inicial de toSignal si es necesario
    take(1),
    map(user => {
      if (!user) {
        return router.createUrlTree(['/auth/login']);
      }

      if (permissionService.hasPermission(module, action)) {
        return true;
      } else {
        // Redirigir a una página de no autorizado o al dashboard
        return router.createUrlTree(['/unauthorized']);
      }
    })
  );
};
