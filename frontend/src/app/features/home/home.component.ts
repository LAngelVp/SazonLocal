import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { BusinessCardComponent } from './components/business-card/business-card.component';
import { AuthModalComponent, AuthMode } from '../auth/auth-modal.component';
import { BusinessService } from '../../core/services/business.service';
import { AuthService } from '../../core/services/auth.service';
import {
  CatalogFilters,
  countActiveFilters,
  createEmptyFilters,
} from '../../core/data/catalog-options';
import { User } from '../../core/models/user.model';

/** Normaliza texto para búsquedas sin acentos ni mayúsculas. */
function normalize(value: string): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NavbarComponent,
    FilterSidebarComponent,
    BusinessCardComponent,
    AuthModalComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly businessService = inject(BusinessService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();
  readonly searchTerm = signal('');
  readonly filters = signal<CatalogFilters>(createEmptyFilters());
  readonly drawerOpen = signal(false);
  readonly authModalOpen = signal(false);
  readonly authMode = signal<AuthMode>('login');

  readonly businesses = this.businessService.businesses;
  readonly loading = this.businessService.loading;
  readonly loadError = this.businessService.error;

  readonly skeletons = [1, 2, 3, 4, 5, 6];

  private redirectAfterAuth: string | null = null;

  readonly activeFilterCount = computed(() => countActiveFilters(this.filters()));
  readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this.searchTerm().trim() !== ''
  );

  readonly localidades = computed(() => {
    const values = this.businesses()
      .map((business) => business.localidad?.trim())
      .filter((value): value is string => Boolean(value));

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'es'));
  });

  /** Filtrado 100 % en cliente, reactivo vía computed(). */
  readonly filteredBusinesses = computed(() => {
    const term = normalize(this.searchTerm());
    const filters = this.filters();

    return this.businesses().filter((business) => {
      if (filters.localidad && business.localidad !== filters.localidad) return false;
      if (filters.tipos.length > 0 && !filters.tipos.includes(business.tipo_negocio)) return false;
      if (filters.comidas.length > 0 && !filters.comidas.includes(business.tipo_comida)) return false;
      if (filters.precios.length > 0 && !filters.precios.includes(business.rango_precios)) return false;

      if (filters.servicios.length > 0) {
        const offered = (business.servicios ?? '').split(',').map((item) => item.trim());
        const matches = filters.servicios.every((service) => offered.includes(service));
        if (!matches) return false;
      }

      if (term) {
        const haystack = normalize(
          [
            business.nombre_negocio,
            business.tipo_comida,
            business.descripcion,
            business.localidad,
            business.colonia_direccion,
            business.servicios,
          ].join(' ')
        );
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.businessService.load();

    this.route.queryParamMap.subscribe((params) => {
      const requestedMode = params.get('auth');
      const redirect = params.get('redirect');

      if (requestedMode === 'login' || requestedMode === 'register') {
        this.authMode.set(requestedMode);
        this.authModalOpen.set(true);
      }

      if (redirect) this.redirectAfterAuth = redirect;
    });
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  // ---------- Autenticación ----------
  openAuth(mode: AuthMode): void {
    this.authMode.set(mode);
    this.authModalOpen.set(true);
  }

  closeAuth(): void {
    this.authModalOpen.set(false);
    this.clearAuthQueryParams();
  }

  onAuthenticated(_user: User): void {
    this.authModalOpen.set(false);
    const redirect = this.redirectAfterAuth;
    this.redirectAfterAuth = null;

    if (redirect) {
      void this.router.navigateByUrl(redirect);
      return;
    }

    this.clearAuthQueryParams();
  }

  private clearAuthQueryParams(): void {
    const hasQuery =
      this.route.snapshot.queryParamMap.has('auth') ||
      this.route.snapshot.queryParamMap.has('redirect');

    if (hasQuery) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
  }

  // ---------- CTA negocio ----------
  requestBusiness(): void {
    if (this.auth.isAuthenticated()) {
      void this.router.navigate(['/registrar-negocio']);
      return;
    }

    this.redirectAfterAuth = '/registrar-negocio';
    this.openAuth('login');
  }

  // ---------- Filtros ----------
  resetFilters(): void {
    this.filters.set(createEmptyFilters());
    this.searchTerm.set('');
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  // ---------- Drawer móvil ----------
  openDrawer(): void {
    this.drawerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.unlockScroll();
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }
}
