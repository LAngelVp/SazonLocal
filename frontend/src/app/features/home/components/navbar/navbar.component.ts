import { Component, HostListener, inject, model, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BusinessService } from '../../../../core/services/business.service';

/**
 * Barra superior fija: logotipo, buscador en tiempo real y controles de sesión.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly businessService = inject(BusinessService);
  private readonly router = inject(Router);

  /** Two-way binding con el término de búsqueda del catálogo. */
  readonly search = model('');

  readonly authRequested = output<'login' | 'register'>();
  readonly businessRequested = output<void>();

  readonly menuOpen = signal(false);

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.search.set('');
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  requestBusiness(): void {
    this.menuOpen.set(false);
    if (this.businessService.limitReached()) return;
    this.businessRequested.emit();
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }
}
