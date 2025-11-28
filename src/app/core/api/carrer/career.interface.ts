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


// Respuesta para store / update: una sola carrera
export interface CareerItemResponse {
  success: boolean;
  message: string;
  data:    Career;
}

// Respuesta para destroy (no devuelve data)
export interface CareerDeleteResponse {
  success: boolean;
  message: string;
}

// Payload para crear / actualizar carrera
export interface CareerPayload {
  name:          string;
  max_semesters: number;
  url_logo:      string;
}


