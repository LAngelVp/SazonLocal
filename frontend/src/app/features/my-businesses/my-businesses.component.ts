import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BusinessService } from '../../core/services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { MAX_BUSINESSES_PER_USER } from '../../core/data/catalog-options';
import { Business } from '../../core/models/business.model';
import { getApiErrorMessage } from '../../core/utils/http-error';

/**
 * Panel privado del usuario: cupo de negocios, edición y eliminación.
 * La eliminación exige confirmación y borra la fila de Google Sheets.
 */
@Component({
  selector: 'app-my-businesses',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-businesses.component.html',
  styleUrl: './my-businesses.component.scss',
})
export class MyBusinessesComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly businessService = inject(BusinessService);
  private readonly toast = inject(ToastService);

  readonly maxBusinesses = MAX_BUSINESSES_PER_USER;
  readonly pendingDelete = signal<Business | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.businessService.loadMine(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  requestDelete(business: Business): void {
    this.pendingDelete.set(business);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target || this.deleting()) return;

    this.deleting.set(true);

    this.businessService.deleteBusiness(target.id_negocio).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.success(`“${target.nombre_negocio}” se eliminó correctamente.`);
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.error(getApiErrorMessage(error, 'No pudimos eliminar el negocio.'));
      },
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  quote(value: number): number {
    return Math.min(100, Math.round((value / this.maxBusinesses) * 100));
  }

  statusClass(status: string): string {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'APROBADO') return 'approved';
    if (normalized === 'PENDIENTE') return 'pending';
    return 'rejected';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancelDelete();
  }
}
