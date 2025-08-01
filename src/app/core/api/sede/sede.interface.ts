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
    deleted_at:          null |Date;
    educational_unit:    EducationalUnit;
}

export interface EducationalUnit {
    id:                  number;
    name:                string;
    organization_domain: null | string;
    url_logo:            string;
    created_at:          Date;
    updated_at:          Date;
    deleted_at:          null |Date;
}
