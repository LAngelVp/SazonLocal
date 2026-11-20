import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models/user.model';

/**
 * Extrae el mensaje más útil de una respuesta de error del backend,
 * contemplando errores de red y respuestas no JSON.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
    }

    const body = error.error as ApiErrorResponse | string | null;

    if (body && typeof body === 'object' && body.error?.message) {
      return body.error.message;
    }

    if (typeof body === 'string' && body.trim() !== '') {
      return body;
    }

    if (error.status === 404) return 'El recurso solicitado no existe.';
    if (error.status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo en unos segundos.';

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
