// core/api/sede/sede.interface.ts

// Respuesta de /sede/index
export interface SedeResponse {
  sedes: Sede[];
}

// Sede "normal" (index)
export interface Sede {
  id: number;

  contry: string; // siempre "Ecuador"

  province_id: number | null;
  province_name: string | null;

  canton_id: number | null;
  canton_name: string | null;

  educational_unit: EducationalUnit | null;
  careers: Career[];

  created_at: string;
  updated_at: string;
}

// Sede con conteo de usuarios (index-admin, store, update)
export interface SedeWithUsersCount extends Sede {
  users_count: number;
}

// Respuesta paginada de /sede/index-admin
export interface SedePaginatedResponse {
  current_page: number;
  data: SedeWithUsersCount[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

// ----------------------------------------
// Relacionados
// ----------------------------------------

export interface EducationalUnit {
  id: number;
  name: string;
  organization_domain: string | null;
  url_logo: string;
  created_at: string;
  updated_at: string;

  // niveles de educación de la unidad
  educational_levels: EducationalLevel[];
}

export interface EducationalLevel {
  id: number;
  name: string;
  description: string | null;
  period: string | null;
  max_periods: number;
  created_at: string;
  updated_at: string;
}

export interface Career {
  id: number;
  name: string;
  max_semesters: number;
  url_logo: string | null;
  created_at: string;
  updated_at: string;
}

// Filtros para /sede/index-admin
export interface SedeAllFilters {
  unitName?: string;
  provinceId?: number | null;
  cantonId?: number | null;
  educationalLevelId?: number | null; // 👈 nuevo filtro
  page?: number;
  perPage?: number;
}

// ----------------------------------------
// DTOs y respuestas CRUD
// ----------------------------------------

// Payload para crear / actualizar sede
export interface SedePayload {
  contry: string;
  province_id: number;
  canton_id: number;
  educational_unit_id: number;
}

// Respuesta genérica del backend para store/update/destroy
export interface SedeApiBaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// store / update -> devuelven una sede (con users_count)
export type SedeItemResponse = SedeApiBaseResponse<SedeWithUsersCount>;

// destroy -> solo success + message (sin data)
export type SedeDeleteResponse = SedeApiBaseResponse<void>;
