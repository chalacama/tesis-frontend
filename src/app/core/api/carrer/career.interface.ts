// src/app/core/api/carrer/career.interface.ts
export interface CareerResponse {
    success: boolean;
    message: string;
    data:    Career[];
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
