import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />
  `,
})
export class AppComponent {
  // Inyectarlo aquí garantiza que la sesión se restaure al arrancar la app.
  private readonly auth = inject(AuthService);

  constructor() {
    if (this.auth.isAuthenticated()) {
      // Revalida el usuario en segundo plano; si el token ya no sirve, el
      // interceptor limpia la sesión automáticamente.
      this.auth.refreshUser().subscribe({ error: () => undefined });
    }
  }
}
