// src/app/services/category.interface.ts

/**
 * Respuesta genérica de la API de Laravel
 * Se adapta a:
 * - index:    data: Category[]
 * - store:    data: Category
 * - update:   data: Category
 * - destroy:  sin data
 */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Modelo de categoría tal como lo devuelve Laravel
 */
export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string; // Laravel devuelve string tipo 'YYYY-MM-DD HH:MM:SS'
  updated_at: string;
  
}

/** Respuesta para listado de categorías */
export type CategoryListResponse = ApiResponse<Category[]>;

/** Respuesta para una sola categoría (store/update/show si lo tuvieras) */
export type CategoryDetailResponse = ApiResponse<Category>;

/** DTO para crear categoría (StoreCategoryRequest) */
export interface CategoryCreateDto {
  name: string;
}

/** DTO para actualizar categoría (UpdateCategoryRequest) */
export interface CategoryUpdateDto {
  name: string;
}

/* ============================================================
 *   SECCIÓN ADMINISTRATIVA (adminIndex)
 *   Con paginación, filtros y contadores extra
 * ============================================================*/

/**
 * Modelo de categoría para el uso ADMINISTRATIVO,
 * extiende Category y añade los conteos que devuelve adminIndex.
 */
export interface CategoryAdmin extends Category {
  /** Cantidad de cursos asociados a la categoría */
  courses_count: number;

  /** Cantidad de usuarios interesados en la categoría */
  users_interested_count: number;
}

/**
 * Meta de paginación que devuelve Laravel en adminIndex
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  // extra que mandamos desde backend
  search?: string | null;
}

/**
 * Respuesta paginada del adminIndex de categorías
 * data: CategoryAdmin[]
 * meta: información de paginación
 */
export interface CategoryAdminListResponse extends ApiResponse<CategoryAdmin[]> {
  meta: PaginationMeta;
}

/**
 * Query params que le enviarás al endpoint adminIndex
 * (filtros y paginación)
 */
export interface CategoryAdminQuery {
  search?: string;
  page?: number;
  per_page?: number;
}
