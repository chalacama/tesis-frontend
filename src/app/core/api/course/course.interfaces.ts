// core/api/course/course.interfaces.ts

export interface CourseRequest {
  title:         string;
  description:   string;
  difficulty_id: number;
  private:       boolean;
}

export interface TutorSummary {
  id: number;
  name: string;
  lastname: string;
  email: string;
  profile_picture_url: string | null;
  username: string;
}

export interface Miniature {
  id: number;
  url: string;
}

export interface DifficultySummary {
  id: number;
  name: string;
}

/**
 * Shape que devuelve /course/index después de los cambios en Laravel
 */
export interface Course {
  id: number;
  title: string;
  description: string;
  private: boolean;
  code: string | null;
  enabled: boolean;
  deleted_at: string | null;

  saved_courses_count: number;
  registrations_count: number;

  miniature: Miniature | null;
  difficulty: DifficultySummary | null;

  // Dueño del curso (campo "creador" del backend)
  creador: TutorSummary | null;

  // Colaboradores del curso
  colaboradores: TutorSummary[];
}

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface CourseResponse {
  courses: Course[];
  pagination: PaginationMeta;
}

/**
 * Filtros soportados por el backend:
 * - enabled, private, difficulty_id
 * - category_id, career_id
 * - collaborator (string: nombre+apellido o username)
 */
export interface CourseFilters {
  enabled?: boolean;
  private?: boolean;
  difficulty_id?: number;

  category_id?: number;
  career_id?: number;

  /**
   * Texto para filtrar por COLABORADOR:
   * - "Nombre Apellido"
   * - username
   */
  collaborator?: string;
}

export interface CourseQueryParams {
  per_page?: number;
  page?: number;
  search?: string;
  filters?: CourseFilters;
}

export interface CourseRouteParams {
  username?: string;
  id?: number;
}
