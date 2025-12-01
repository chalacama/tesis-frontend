// src/app/core/api/carrer/career.interface.ts

/**
 * Respuesta genérica de la API de Laravel
 */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Modelo base de carrera (index normal)
 */
export interface Career {
  id: number;
  name: string;
  max_semesters: number;
  url_logo: string;
  // Laravel devuelve string tipo 'YYYY-MM-DD HH:MM:SS'
  created_at: string;
  updated_at: string;
}

/** Respuesta para listado simple de carreras (index) */
export type CareerResponse = ApiResponse<Career[]>;

/** Respuesta para store / update: una sola carrera */
export type CareerItemResponse = ApiResponse<Career>;

/** Respuesta para destroy (no devuelve data) */
export type CareerDeleteResponse = ApiResponse<null>;

/** Payload para crear / actualizar carrera */
export interface CareerPayload {
  name: string;
  max_semesters: number;
  url_logo: string;
}

/* ============================================================
 *   SECCIÓN ADMIN (index-admin)
 *   Con paginación, filtros y datos extra
 * ============================================================*/

/**
 * Carrera en el contexto administrativo:
 * incluye conteos extra devueltos por indexAdmin.
 */
export interface CareerAdmin extends Career {
  /** Cantidad de cursos relacionados a la carrera */
  courses_count: number;

  /** Cantidad de usuarios que están en esta carrera */
  users_count: number;

  /** Cantidad de sedes donde existe esta carrera */
  sedes_count: number;
}

/**
 * Meta de paginación que devuelve Laravel en indexAdmin
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  // filtros que mandamos desde el frontend (opcional)
  name?: string | null;
  max_semesters?: number | string | null;
}

/**
 * Respuesta paginada del indexAdmin de carreras
 * data: CareerAdmin[]
 * meta: info de paginación
 */
export interface CareerAdminListResponse extends ApiResponse<CareerAdmin[]> {
  meta: PaginationMeta;
}

/**
 * Query params para el indexAdmin
 */
export interface CareerAdminQuery {
  name?: string;
  max_semesters?: number;
  page?: number;
  per_page?: number;
}
