import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

/** Notificaciones ligeras, sin dependencias externas. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toast = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sequence = 0;

  readonly toast = this._toast.asReadonly();

  show(message: string, type: ToastType = 'info', durationMs = 4200): void {
    this.sequence += 1;
    this._toast.set({ id: this.sequence, message, type });

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.dismiss(), durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 6000);
  }

  dismiss(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._toast.set(null);
  }
}
