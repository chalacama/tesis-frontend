// core/api/profile/education.interface.ts

export interface EducationalResponse {
  educationalUser: EducationalUser | null;
}

export interface EducationalUser {
  id:                   number;
  sede_id:              number | null;
  user_id:              number;
  career_id:            number | null;
  educational_level_id: number | null;
  level:                number | null;
  created_at:           string;
  updated_at:           string;

  // Relaciones formateadas desde el backend
  educational_level:    EducationalLevel | null;
  sede:                 Sede | null;
  career:               Career | null;
}

// ---------- Sede + EducationalUnit ----------

export interface Sede {
  id:         number;
  contry:     string;

  province_id:   number | null;
  province_name: string | null;

  canton_id:     number | null;
  canton_name:   string | null;

  // Puede venir o no en esta respuesta
  educational_unit?: EducationalUnit | null;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface EducationalUnit {
  id:                  number;
  name:                string;
  organization_domain: string | null;
  url_logo:            string;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

// ---------- Career ----------

export interface Career {
  id:            number;
  name:          string;
  max_semesters: number;
  url_logo:      string | null;
  created_at:    string;
  updated_at:    string;
  deleted_at?:   string | null;
}

// ---------- EducationalLevel ----------

export interface EducationalLevel {
  id:          number;
  name:        string;
  description: string | null;
  period:      string | null;
  max_periods: number;
  created_at:  string;
  updated_at:  string;
}

// ---------- Request para update ----------

export interface EducationalRequest {
  sede_id:              number | null;
  career_id:            number | null;
  educational_level_id: number | null;
  level:                number | null;
}
