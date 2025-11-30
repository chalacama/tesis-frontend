// course.details.interfaces.ts
export interface CourseDetailResponse {
    message: string;
    course:  CourseDetail;
}

export interface CourseDetail {
    id:            number;
    title:         string;
    description:   string;
    private:       boolean;
    code:          string | null;
    enabled:       boolean;
    difficulty:    Difficulty;
    created_at:    string;
    updated_at:    string;
    deleted_at:    null;

    miniature:     Miniature | null;
    categories:    Category[] | null;
    careers:       Career[] | null;
    
}

export interface Career {
    id:    number;
    name:  string;
    pivot: CareerPivot;
}

export interface CareerPivot {
    course_id: number;
    career_id: number;
}

export interface Category {
    id:    number;
    name:  string;
    pivot: CategoryPivot;
}

export interface CategoryPivot {
    course_id:   number;
    category_id: number;
    order:       number;
}

export interface Difficulty {
    id:   number;
    name: string;
}

export interface Miniature {
    id:        number;
    course_id: number;
    url:       string;
}
export interface CodeResponse {
    message: string;
    code:    string;
}

export interface CourseDetailRequest {
  title?: string;
  description?: string;
  private?: boolean;
  enabled?: boolean;
  difficulty_id?: number;
  code?: string | null;

  // Relaciones
  // Hasta 2 carreras (ids)
  careers?: number[];

  // Hasta 4 categorías: puedes enviar solo ids o { id, order }
  categories?: (number | { id: number; order?: number })[];

  // Archivo para miniatura (si lo incluyes, el request se envía como multipart/form-data)
  miniature?: File | null;

  remove_miniature?: boolean;
  
}
