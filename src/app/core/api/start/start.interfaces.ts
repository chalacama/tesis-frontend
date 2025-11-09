// start.interfaces.ts

export interface CourseResponse {
  courses: Course[];
  has_more: boolean;
  current_page: number;
}

export interface CourseRequest {
  filter: string;
  page: number;
  per_page: number;
  /** término de búsqueda (opcional) */
  q?: string;
}

export interface Course {
  id:                         number;
  title:                      string;
  description:                string;
  created_at:                 string | null;
  thumbnail_url:              string | null;
  tutor:                      Tutor | null;
  category:                   Category | null;
  careers:                    Career[];
  difficulty:                 Category | null;
  registrations_count:        number;
  saved_courses_count:        number;
  average_rating:             number;
  is_saved:                   boolean;
  is_registered:              boolean;
  first_learning_content_url: string | null;
}

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
