// sede.interface.ts

export interface SedeResponse {
  sedes: Sede[];
}

export interface Sede {
  id:                  number;
  province:            string;
  canton:              string;
  educational_unit_id: number;
  created_at:          Date;
  updated_at:          Date;
  deleted_at:          null | Date;
  educational_unit:    EducationalUnit;

  // ➕ NUEVO: carreras asociadas a la sede
  careers:             Career[];
}

export interface EducationalUnit {
  id:                  number;
  name:                string;
  organization_domain: null | string;
  url_logo:            string;
  created_at:          Date;
  updated_at:          Date;
  deleted_at:          null | Date;

  // ➕ NUEVO: niveles de educación de la unidad
  educational_levels:  EducationalLevel[];
}

export interface EducationalLevel {
  id:          number;
  name:        string;
  description: string | null;
  period:      string | null;
  max_periods: number;
  created_at:  Date;
  updated_at:  Date;
}

export interface Career {
  id:            number;
  name:          string;
  max_semesters: number;
  url_logo:      string | null;
  created_at:    Date;
  updated_at:    Date;
}
