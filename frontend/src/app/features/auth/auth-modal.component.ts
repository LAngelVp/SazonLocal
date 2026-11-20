import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { getApiErrorMessage } from '../../core/utils/http-error';

export type AuthMode = 'login' | 'register';

/**
 * Modal de autenticación con pestañas Login / Registro.
 * Validaciones reactivas, estados de carga y mensajes de error del servidor.
 */
@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
})
export class AuthModalComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly mode = model<AuthMode>('login');
  readonly closed = output<void>();
  readonly authenticated = output<User>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.fb.group({
    nombre_completo: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    ],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.pattern(/^[0-9+\s()-]{10,20}$/)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set(null);
  }

  close(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  submitLogin(): void {
    if (this.submitting()) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.loginForm.getRawValue()).subscribe({
      next: ({ user }) => {
        this.submitting.set(false);
        this.toast.success(`¡Bienvenido de nuevo, ${user.nombre_completo.split(' ')[0]}!`);
        this.authenticated.emit(user);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(getApiErrorMessage(error, 'No pudimos iniciar sesión.'));
      },
    });
  }

  submitRegister(): void {
    if (this.submitting()) return;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.register(this.registerForm.getRawValue()).subscribe({
      next: ({ user }) => {
        this.submitting.set(false);
        this.toast.success('Tu cuenta está lista. ¡Bienvenido a SazónLocal!');
        this.authenticated.emit(user);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(getApiErrorMessage(error, 'No pudimos crear tu cuenta.'));
      },
    });
  }
}
