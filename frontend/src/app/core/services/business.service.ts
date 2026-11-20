import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Business, BusinessPayload } from '../models/business.model';
import { MAX_BUSINESSES_PER_USER } from '../data/catalog-options';
import { getApiErrorMessage } from '../utils/http-error';
import { AuthService } from './auth.service';

export interface DeleteBusinessResponse {
  message: string;
  id_negocio: string;
  nombre_negocio: string;
}

/**
 * Fuente de verdad del catálogo y de "mis negocios" en el cliente.
 * El backend es la autoridad final del límite de 5 negocios por usuario.
 */
@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/businesses`;

  readonly maxBusinesses = MAX_BUSINESSES_PER_USER;

  // Catálogo público aprobado.
  private readonly _businesses = signal<Business[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);

  // Negocios del usuario autenticado (incluye pendientes).
  private readonly _myBusinesses = signal<Business[]>([]);
  private readonly _myLoading = signal(false);
  private readonly _myError = signal<string | null>(null);
  private readonly _myLoaded = signal(false);

  readonly businesses = this._businesses.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly myBusinesses = this._myBusinesses.asReadonly();
  readonly myLoading = this._myLoading.asReadonly();
  readonly myError = this._myError.asReadonly();
  readonly myLoaded = this._myLoaded.asReadonly();

  readonly myBusinessCount = computed(() => this._myBusinesses().length);
  readonly remainingSlots = computed(() =>
    Math.max(0, this.maxBusinesses - this.myBusinessCount())
  );
  readonly limitReached = computed(
    () => this.myBusinessCount() >= this.maxBusinesses
  );

  constructor() {
    // Carga/limpia el panel automáticamente al iniciar o cerrar sesión.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadMine();
      } else {
        this.resetMine();
      }
    });
  }

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

  loadMine(force = false): void {
    if (!this.auth.isAuthenticated()) return;
    if (this._myLoading()) return;
    if (this._myLoaded() && !force) return;

    this._myLoading.set(true);
    this._myError.set(null);

    const requestedFor = this.auth.user()?.id_usuario;

    this.http.get<Business[]>(`${this.apiUrl}/mine`).subscribe({
      next: (businesses) => {
        // Evita repoblar el panel si la sesión cambió mientras respondía.
        if (this.auth.user()?.id_usuario !== requestedFor) {
          this._myLoading.set(false);
          return;
        }

        this._myBusinesses.set(Array.isArray(businesses) ? businesses : []);
        this._myLoaded.set(true);
        this._myLoading.set(false);
      },
      error: (error: unknown) => {
        if (this.auth.user()?.id_usuario !== requestedFor) {
          this._myLoading.set(false);
          return;
        }

        this._myError.set(getApiErrorMessage(error, 'No pudimos cargar tus negocios.'));
        this._myLoading.set(false);
      },
    });
  }

  create(payload: BusinessPayload): Observable<Business> {
    return this.http.post<Business>(this.apiUrl, payload).pipe(
      tap((created) => {
        this._myBusinesses.update((current) => [
          created,
          ...current.filter((item) => item.id_negocio !== created.id_negocio),
        ]);
        this._myLoaded.set(true);

        // Si el backend publica de inmediato, aparece sin recargar la página.
        if (created.estado_publicacion === 'APROBADO') {
          this._businesses.update((current) => [
            created,
            ...current.filter((item) => item.id_negocio !== created.id_negocio),
          ]);
        }
      })
    );
  }

  update(idNegocio: string, payload: Partial<BusinessPayload>): Observable<Business> {
    return this.http.put<Business>(`${this.apiUrl}/${encodeURIComponent(idNegocio)}`, payload).pipe(
      tap((updated) => {
        this._myBusinesses.update((current) =>
          current.map((item) => (item.id_negocio === updated.id_negocio ? updated : item))
        );
        this._businesses.update((current) =>
          current.map((item) => (item.id_negocio === updated.id_negocio ? updated : item))
        );
      })
    );
  }

  /** Elimina un negocio propio. El backend valida propiedad y borra la fila. */
  deleteBusiness(idNegocio: string): Observable<DeleteBusinessResponse> {
    return this.http
      .delete<DeleteBusinessResponse>(`${this.apiUrl}/${encodeURIComponent(idNegocio)}`)
      .pipe(
        tap(() => {
          this._myBusinesses.update((current) =>
            current.filter((item) => item.id_negocio !== idNegocio)
          );
          this._businesses.update((current) =>
            current.filter((item) => item.id_negocio !== idNegocio)
          );
        })
      );
  }

  /** Subida opcional a ImgBB. Requiere IMGBB_API_KEY en el backend. */
  uploadImage(dataUrl: string): Observable<{ url: string; thumbnail: string }> {
    return this.http.post<{ url: string; thumbnail: string }>(
      `${environment.apiUrl}/uploads/image`,
      { image: dataUrl }
    );
  }

  private resetMine(): void {
    this._myBusinesses.set([]);
    this._myLoading.set(false);
    this._myError.set(null);
    this._myLoaded.set(false);
  }
}
