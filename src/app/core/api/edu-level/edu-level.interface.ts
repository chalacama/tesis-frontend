// edu-level.interface.ts
// src/app/core/api/edu-level/edu-level.interface.ts

/** Respuesta genérica tipo Laravel */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/** Modelo base de nivel educativo */
export interface EduLevel {
  id: number;
  name: string;
  description: string | null;
  period: string;
  max_periods: number;
  created_at: string; // 'YYYY-MM-DD HH:MM:SS'
  updated_at: string;
}

/** Modelo para index-admin: incluye conteos */
export interface EduLevelAdmin extends EduLevel {
  users_count: number;
  educational_units_count: number;
}

/** Meta de paginación devuelta por index-admin */
export interface EduLevelAdminMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  name: string | null;
  period: string | null;
  max_periods: number | null;
}

/** Respuesta de index (ligero) */
export type EduLevelIndexResponse = ApiResponse<EduLevel[]>;

/** Respuesta de index-admin (lista + meta) */
export interface EduLevelAdminIndexResponse {
  success: boolean;
  message: string;
  data: EduLevelAdmin[];
  meta: EduLevelAdminMeta;
}

/** Respuesta de store / update: una sola entidad */
export type EduLevelSaveResponse = ApiResponse<EduLevel>;

/** Respuesta de destroy */
export interface EduLevelDeleteResponse {
  success: boolean;
  message: string;
}

/** Payload para crear / actualizar nivel educativo */
export interface EduLevelPayload {
  name: string;
  description?: string | null;
  period: string;
  max_periods: number;
}

