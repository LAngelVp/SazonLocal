/**
 * Modelos de negocio tal como viven en la pestaña "Negocios".
 * Google Sheets devuelve strings; por eso todos los campos son string.
 */
export type BusinessStatus = 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';

export interface Business {
  id_negocio: string;
  id_usuario?: string;
  nombre_negocio: string;
  localidad: string;
  colonia_direccion: string;
  tipo_negocio: string;
  tipo_comida: string;
  descripcion: string;
  rango_precios: string;
  horario: string;
  whatsapp_telefono: string;
  url_imagen: string;
  enlace_maps: string;
  servicios: string;
  estado_publicacion: BusinessStatus | string;
  fecha_creacion: string;
}

/** Campos que el usuario captura en el formulario. */
export type BusinessPayload = Omit<
  Business,
  'id_negocio' | 'id_usuario' | 'estado_publicacion' | 'fecha_creacion'
>;

/** Estructura usada por la previsualización en vivo de la card. */
export type BusinessPreview = Pick<
  Business,
  | 'nombre_negocio'
  | 'localidad'
  | 'colonia_direccion'
  | 'tipo_negocio'
  | 'tipo_comida'
  | 'descripcion'
  | 'rango_precios'
  | 'horario'
  | 'whatsapp_telefono'
  | 'url_imagen'
  | 'enlace_maps'
  | 'servicios'
> & {
  id_negocio: string;
  estado_publicacion: string;
  fecha_creacion: string;
};
