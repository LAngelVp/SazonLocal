import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Adjunta el JWT a cada petición dirigida a nuestra API.
 * Si el backend responde 401 (token vencido), cierra la sesión local.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApiRequest = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');

  const authorizedRequest =
    token && isApiRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      const status = (error as { status?: number }).status;
      if (status === 401 && auth.isAuthenticated()) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
