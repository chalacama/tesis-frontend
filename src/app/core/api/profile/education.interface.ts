
export interface EducationalResponse {
    educationalUser: EducationalUser;
}

export interface EducationalUser {
    id:                   number;
    sede_id:              number;
    user_id:              number;
    career_id:            number;
    educational_level_id: number;
    level:                number;
    created_at:           Date;
    updated_at:           Date;
    educational_level:    EducationalLevel;
    sede:                 Sede;
    career:               Career;
    educational_unit:     EducationalUnit;
}
interface EducationalUnit {
  id: number;
  name: string;
  organization_domain: string;
  url_logo: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export interface Career {
    id:            number;
    name:          string;
    max_semesters: number;
    url_logo:      string;
    created_at:    Date;
    updated_at:    Date;
    deleted_at:    null;
}

export interface EducationalLevel {
    id:          number;
    name:        string;
    description: string;
    period:      string;
    max_periods: number;
    created_at:  Date;
    updated_at:  Date;
}

export interface Sede {
    id:                  number;
    contry:              string;
    province:            string;
    canton:              string;
    educational_unit_id: number;
    created_at:          Date;
    updated_at:          Date;
    deleted_at:          null;
}
export interface EducationalRequest {
    sede_id:              number | null;
    career_id:            number | null;
    educational_level_id: number | null;
    level:                number | null;
}


