export interface CourseResponse {
    courses:    Course[];
    pagination: Pagination;
}
export interface Miniature {
    id : number;
    url : string
}
export interface Course {
    id:                   number;
    title:                string;
    description:          string;
    private:              boolean;
    code:                 null | string;
    enabled:              boolean;
    deleted_at:           null;
    modules_count:        number;
    total_comments_count: number;
    saved_courses_count:  number;
    registrations_count:  number;
    total_stars:          number;
    is_certified:         boolean;
    difficulty:           Difficulty;
    miniature:            Miniature;
    categorias:           Difficulty[];
    creador:              string;
    colaboradores:        string[];
}

export interface Difficulty {
    id:   number;
    name: string;
}

export interface Pagination {
    total:        number;
    per_page:     number;
    current_page: number;
    last_page:    number;
}
export interface CourseFilters {
  enabled?: boolean;
  private?: boolean;
  difficulty_id?: number;
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
export interface CourseForm {
    title:         string;
    description:   string;
    difficulty_id: number;
    private:       boolean;
}
export interface CourseRequest {
    title:         string;
    description:   string;
    difficulty_id: number;
    private:       boolean;
}






