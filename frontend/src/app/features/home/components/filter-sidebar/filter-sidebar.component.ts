import { Component, computed, input, model, output } from '@angular/core';
import {
  BUSINESS_TYPES,
  CatalogFilters,
  FOOD_TYPES,
  PRICE_RANGES,
  SERVICES,
  countActiveFilters,
  createEmptyFilters,
} from '../../../../core/data/catalog-options';

type ToggleGroup = 'tipos' | 'comidas' | 'precios' | 'servicios';

/**
 * Panel lateral de filtros. Recibe las localidades dinámicas del catálogo
 * y mantiene un objeto de filtros inmutable para que los `computed()`
 * del catálogo reaccionen de inmediato.
 */
@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.scss',
})
export class FilterSidebarComponent {
  readonly localidades = input<string[]>([]);
  readonly filters = model.required<CatalogFilters>();
  readonly closed = output<void>();

  readonly businessTypes = BUSINESS_TYPES;
  readonly foodTypes = FOOD_TYPES;
  readonly priceRanges = PRICE_RANGES;
  readonly services = SERVICES;

  readonly activeCount = computed(() => countActiveFilters(this.filters()));

  setLocalidad(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filters.update((current) => ({ ...current, localidad: value }));
  }

  isActive(group: ToggleGroup, value: string): boolean {
    return this.filters()[group].includes(value);
  }

  toggle(group: ToggleGroup, value: string): void {
    this.filters.update((current) => {
      const selected = current[group];
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      return { ...current, [group]: next };
    });
  }

  reset(): void {
    this.filters.set(createEmptyFilters());
  }
}
