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
