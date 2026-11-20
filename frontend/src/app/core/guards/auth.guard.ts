import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protege rutas privadas (registro de negocios).
 * Si no hay sesión, redirige al inicio y abre el modal de login,
 * conservando la ruta deseada en `redirect`.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/'], {
    queryParams: { auth: 'login', redirect: state.url },
  });
};
