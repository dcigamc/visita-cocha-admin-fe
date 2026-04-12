import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';

/**
 * Guard funcional que verifica si el usuario está autenticado en Firebase Auth.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      } else {
        // Guardar la URL intentada para redireccionar después del login si es necesario
        return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
      }
    })
  );
};
