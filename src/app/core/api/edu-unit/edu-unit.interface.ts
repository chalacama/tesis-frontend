// src/app/core/api/edu-unit/edu-unit.interface.ts

/** Respuesta genérica tipo Laravel */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/** Meta de paginación devuelta por index-admin */
export interface EduUnitAdminMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  name: string | null;
  organization_domain: string | null;
}

/** Nivel educativo asociado a la unidad (educational_levels) */
export interface EducationalLevel {
  id: number;
  name: string;
  description: string | null;
  period: string | null;
  max_periods: number;
}

/** Modelo base de Unidad Educativa (index ligero) */
export interface EduUnit {
  id: number;
  name: string;
  organization_domain: string | null;
  url_logo: string;
  created_at: string; // Laravel: 'YYYY-MM-DD HH:MM:SS'
  updated_at: string;
}

/** Modelo para index-admin: incluye conteos y niveles */
export interface EduUnitAdmin extends EduUnit {
  sedes_count: number;
  users_count: number;
  educational_levels: EducationalLevel[];
}

/** Modelo que devuelve store/update: unidad + niveles (sin conteos) */
export interface EduUnitWithLevels extends EduUnit {
  educational_levels: EducationalLevel[];
}

/** Respuesta de index (ligero) */
export type EduUnitIndexResponse = ApiResponse<EduUnit[]>;

/** Respuesta de index-admin (lista + meta) */
export interface EduUnitAdminIndexResponse {
  success: boolean;
  message: string;
  data: EduUnitAdmin[];
  meta: EduUnitAdminMeta;
}

/** Respuesta de store/update */
export type EduUnitSaveResponse = ApiResponse<EduUnitWithLevels>;

/** Respuesta de destroy */
export interface EduUnitDeleteResponse {
  success: boolean;
  message: string;
}

/** Payload para crear/actualizar unidad educativa */
export interface EduUnitPayload {
  name: string;
  url_logo: string;
  organization_domain?: string | null;
  educational_level_ids: number[]; // mínimo 1 en backend
}
