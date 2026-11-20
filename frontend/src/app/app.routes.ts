import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Carga diferida por ruta: el catálogo es el bundle inicial y el
 * formulario de negocio se descarga solo cuando se necesita.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'SazónLocal · Directorio Gastronómico Local',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'registrar-negocio',
    title: 'Registrar negocio · SazónLocal',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/business-form/business-form.component').then((m) => m.BusinessFormComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
