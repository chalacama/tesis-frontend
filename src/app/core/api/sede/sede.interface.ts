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

// Sede con conteo de usuarios (index-all)
export interface SedeWithUsersCount extends Sede {
  users_count: number;
}

// Respuesta paginada de /sede/index-all
export interface SedePaginatedResponse {
  current_page: number;
  data: SedeWithUsersCount[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

// --------------------------------------------------
// Relacionados
// --------------------------------------------------

export interface EducationalUnit {
  id: number;
  name: string;
  organization_domain: string | null;
  url_logo: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

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
