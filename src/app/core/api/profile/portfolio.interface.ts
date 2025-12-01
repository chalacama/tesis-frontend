export interface PortfolioResponse {
    message:   string;
    portfolio: Portfolio;
}

export interface Portfolio {
    name:                 string;
    lastname:             string;
    username:             string;
    email:                string;
    profile_picture_url?: string;
    joined_at:            string;
    career:               Career;
    sede:                 Sede;
    active_courses_count: number;
    role:                 string;
}

export interface Career {
    id:                   number;
    name:                 string;
    max_semesters?:       number;
    url_logo:             string;
    created_at:           Date;
    updated_at:           Date;
    
    organization_domain?: string;
}

export interface Sede {
    id:               number;
    province_id:      number;
    canton_id:        number;
    province:         string;
    canton:           string;
    educational_unit: Career;
}
