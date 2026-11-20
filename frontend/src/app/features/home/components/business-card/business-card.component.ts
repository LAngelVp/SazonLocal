import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { BusinessPreview } from '../../../../core/models/business.model';
import { PRICE_LABELS } from '../../../../core/data/catalog-options';

/**
 * Tarjeta de negocio. Se reutiliza en el catálogo y en la previsualización
 * en vivo del formulario de registro.
 */
@Component({
  selector: 'app-business-card',
  standalone: true,
  templateUrl: './business-card.component.html',
  styleUrl: './business-card.component.scss',
})
export class BusinessCardComponent {
  readonly business = input.required<BusinessPreview>();
  readonly preview = input(false);

  readonly imageFailed = signal(false);
  private lastImageUrl = '';

  constructor() {
    // Si la URL cambia, damos una nueva oportunidad de carga a la imagen.
    effect(() => {
      const url = this.business().url_imagen ?? '';
      if (url !== this.lastImageUrl) {
        this.lastImageUrl = url;
        untracked(() => this.imageFailed.set(false));
      }
    });
  }

  readonly priceLabel = computed(() => PRICE_LABELS[this.business().rango_precios] ?? '');
  readonly serviceList = computed(() =>
    (this.business().servicios ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

  readonly whatsappLink = computed(() => {
    const digits = (this.business().whatsapp_telefono ?? '').replace(/\D/g, '');
    if (!digits) return null;
    const text = encodeURIComponent(
      `Hola, vi ${this.business().nombre_negocio || 'tu negocio'} en SazónLocal y me gustaría más información.`
    );
    return `https://wa.me/${digits}?text=${text}`;
  });

  readonly mapsLink = computed(() => {
    const explicit = (this.business().enlace_maps ?? '').trim();
    if (/^https?:\/\//i.test(explicit)) return explicit;

    const query = encodeURIComponent(
      [this.business().nombre_negocio, this.business().colonia_direccion, this.business().localidad]
        .filter(Boolean)
        .join(', ')
    );
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }
}
