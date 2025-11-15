// start.interfaces.ts

export interface CourseResponse {
  courses: Course[];
  has_more: boolean;
  current_page: number;
}

/**
 * Request para el HOME (start/courses-by-filter)
 */
export interface CourseRequest {
  filter: string;   // all | popular | best_rated | created | updated | recommended, etc.
  page: number;
  per_page: number;
  /** término de búsqueda (opcional) */
  q?: string;
}

/**
 * Estructura de curso TRAÍDA DESDE EL BACKEND
 * (ya sin category, careers, difficulty, saved_courses_count, average_rating)
 */
export interface Course {
  id:                         number;
  title:                      string;
  description:                string;
  created_at:                 string | null;
  thumbnail_url:              string | null;
  tutor:                      Tutor | null;
  registrations_count:        number;
  is_saved:                   boolean;
  is_registered:              boolean;
  first_learning_content_url: string | null;
}

/**
 * Las dejo por si las usas en otros sitios.
 * Ya no están ligadas directamente a Course.
 */
export interface Career {
  id:       number;
  logo_url: string;
}

export interface Category {
  id:   number;
  name: string;
}

export interface Tutor {
  id:                  number | null;
  name:                string | null;
  username:            string | null;
  profile_picture_url: string | null;
}
