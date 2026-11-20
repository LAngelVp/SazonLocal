import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Notificación global (bottom center). Se monta una sola vez en AppComponent.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toastService.toast(); as toast) {
      <div class="toast-host" aria-live="polite" aria-atomic="true">
        <div class="toast" [class]="'toast toast--' + toast.type" role="status">
          <span class="toast__icon" aria-hidden="true">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6M12 16.5v.5" stroke-linecap="round" />
                </svg>
              }
              @default {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 7.5v.5" stroke-linecap="round" />
                </svg>
              }
            }
          </span>
          <p class="toast__message">{{ toast.message }}</p>
          <button class="toast__close" type="button" (click)="toastService.dismiss()" aria-label="Cerrar notificación">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
