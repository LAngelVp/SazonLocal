/**
 * Catálogos compartidos por validaciones del backend.
 * Deben coincidir con las opciones del frontend.
 */
const BUSINESS_TYPES = [
  'Restaurante',
  'Cafetería',
  'Food Truck',
  'Cocina Económica',
  'Dark Kitchen',
  'Puesto Callejero',
  'Panadería/Repostería',
];

const FOOD_TYPES = [
  'Mexicana',
  'Mariscos',
  'Italiana',
  'Hamburguesas',
  'Asiática',
  'Cortes',
  'Postres',
  'Saludable',
];

const PRICE_RANGES = ['$', '$$', '$$$'];

const SERVICES = ['Comedor', 'Para llevar', 'A domicilio'];

const PUBLICATION_STATES = ['APROBADO', 'PENDIENTE', 'RECHAZADO'];

module.exports = { BUSINESS_TYPES, FOOD_TYPES, PRICE_RANGES, SERVICES, PUBLICATION_STATES };
