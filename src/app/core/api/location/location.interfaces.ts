// core/api/location/location.interfaces.ts

/**
 * Elemento básico de ubicación que devuelve el backend
 * (provincia, cantón o parroquia).
 */
export interface LocationItem {
  id: number;
  name: string;
}

/**
 * Respuesta genérica del backend para listas de ubicaciones.
 */
export interface LocationListResponse {
  data: LocationItem[];
}
