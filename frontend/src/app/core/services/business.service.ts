import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Business, BusinessPayload } from '../models/business.model';
import { getApiErrorMessage } from '../utils/http-error';

/**
 * Fuente de verdad del catálogo en el cliente.
 * El backend ya entrega solo negocios APROBADOS y cachea 30 s.
 */
@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/businesses`;

  private readonly _businesses = signal<Business[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);

  readonly businesses = this._businesses.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(force = false): void {
    if (this._loading()) return;
    if (this._loaded() && !force) return;

    this._loading.set(true);
    this._error.set(null);

    this.http.get<Business[]>(this.apiUrl).subscribe({
      next: (businesses) => {
        this._businesses.set(Array.isArray(businesses) ? businesses : []);
        this._loaded.set(true);
        this._loading.set(false);
      },
      error: (error: unknown) => {
        this._error.set(getApiErrorMessage(error, 'No pudimos cargar el directorio.'));
        this._loading.set(false);
      },
    });
  }

  create(payload: BusinessPayload): Observable<Business> {
    return this.http.post<Business>(this.apiUrl, payload).pipe(
      tap((created) => {
        // Si el backend publica de inmediato, aparece sin recargar la página.
        if (created.estado_publicacion === 'APROBADO') {
          this._businesses.update((current) => [
            created,
            ...current.filter((item) => item.id_negocio !== created.id_negocio),
          ]);
          this._loaded.set(true);
        }
      })
    );
  }

  update(idNegocio: string, payload: Partial<BusinessPayload>): Observable<Business> {
    return this.http.put<Business>(`${this.apiUrl}/${encodeURIComponent(idNegocio)}`, payload).pipe(
      tap((updated) => {
        this._businesses.update((current) =>
          current.map((item) => (item.id_negocio === updated.id_negocio ? updated : item))
        );
      })
    );
  }

  mine(): Observable<Business[]> {
    return this.http.get<Business[]>(`${this.apiUrl}/mine`);
  }

  /** Subida opcional a ImgBB. Requiere IMGBB_API_KEY en el backend. */
  uploadImage(dataUrl: string): Observable<{ url: string; thumbnail: string }> {
    return this.http.post<{ url: string; thumbnail: string }>(
      `${environment.apiUrl}/uploads/image`,
      { image: dataUrl }
    );
  }
}
