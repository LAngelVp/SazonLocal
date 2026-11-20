/**
 * Catálogos del directorio. Deben coincidir con backend/src/config/businessOptions.js
 */
export const BUSINESS_TYPES = [
  'Restaurante',
  'Cafetería',
  'Food Truck',
  'Cocina Económica',
  'Dark Kitchen',
  'Puesto Callejero',
  'Panadería/Repostería',
] as const;

export const FOOD_TYPES = [
  'Mexicana',
  'Mariscos',
  'Italiana',
  'Hamburguesas',
  'Asiática',
  'Cortes',
  'Postres',
  'Saludable',
] as const;

export const PRICE_RANGES = ['$', '$$', '$$$'] as const;

/** Regla de negocio compartida con el backend. */
export const MAX_BUSINESSES_PER_USER = 5;

export const SERVICES = ['Comedor', 'Para llevar', 'A domicilio'] as const;

export const PRICE_LABELS: Record<string, string> = {
  $: 'Económico',
  $$: 'Moderado',
  $$$: 'Premium',
};

export interface CatalogFilters {
  localidad: string;
  tipos: string[];
  comidas: string[];
  precios: string[];
  servicios: string[];
}

/** Devuelve un estado de filtros limpio (nunca reutilices el mismo objeto). */
export function createEmptyFilters(): CatalogFilters {
  return {
    localidad: '',
    tipos: [],
    comidas: [],
    precios: [],
    servicios: [],
  };
}

/** Cuenta cuántos grupos de filtros están activos. */
export function countActiveFilters(filters: CatalogFilters): number {
  return (
    (filters.localidad ? 1 : 0) +
    filters.tipos.length +
    filters.comidas.length +
    filters.precios.length +
    filters.servicios.length
  );
}
