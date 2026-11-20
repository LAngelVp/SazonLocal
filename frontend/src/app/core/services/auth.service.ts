import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../models/user.model';

const TOKEN_KEY = 'sazonlocal.token';
const USER_KEY = 'sazonlocal.user';

/** Comprueba si un JWT ya expiró leyendo su claim `exp`. */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function readStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && !isTokenExpired(token) ? token : null;
  } catch {
    return null;
  }
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/**
 * Estado de sesión basado en Signals.
 * El token y el usuario se persisten en localStorage para sobrevivir recargas.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _token = signal<string | null>(readStoredToken());
  private readonly _user = signal<User | null>(readStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this._token() && this._user()));
  readonly firstName = computed(() => this._user()?.nombre_completo?.split(' ')[0] ?? '');
  readonly initials = computed(() => {
    const name = this._user()?.nombre_completo?.trim();
    if (!name) return '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  constructor() {
    // Si el token expiró mientras la app estaba cerrada, limpia la sesión.
    const token = this._token();
    if (!token || isTokenExpired(token)) {
      this.clearSession();
    }
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.applySession(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, payload)
      .pipe(tap((response) => this.applySession(response)));
  }

  /** Revalida el token contra el backend y actualiza los datos del usuario. */
  refreshUser(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`).pipe(
      map((response) => response.user),
      tap((user) => {
        this._user.set(user);
        this.persistUser(user);
      })
    );
  }

  logout(): void {
    this.clearSession();
  }

  private applySession(response: AuthResponse): void {
    this._token.set(response.token);
    this._user.set(response.user);

    try {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch {
      // Almacenamiento bloqueado (modo privado): la sesión vive en memoria.
    }
  }

  private persistUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignorar fallos de almacenamiento.
    }
  }

  private clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignorar.
    }
  }
}
