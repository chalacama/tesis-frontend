// core/api/user/user.interfaces.ts

/**
 * Item de usuario que devuelve el backend en /user/index
 */
export interface UserListItem {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  profile_picture_url: string;
  rol: string | null;      // nombre del rol (admin, tutor, student, etc.)
  role_id: number | null;  // id del rol
}

/**
 * Estructura de paginación típica de Laravel paginate()
 */
export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

/**
 * Parámetros de filtro/orden para listar usuarios
 */
export type UserSort = 'recent' | 'oldest' | 'alpha_asc' | 'alpha_desc';

export interface UserListParams {
  search?: string;       // filtra por name, lastname, email
  role_id?: number;      // filtro por id de rol
  sort?: UserSort;       // tipo de orden
  page?: number;         // página actual
  per_page?: number;     // tamaño de página
}

/**
 * Request para cambiar el rol de un usuario
 * PUT /user/{user}/change-role
 */
export interface ChangeUserRoleRequest {
  role_id: number;
}

/**
 * Response del backend al cambiar el rol
 * {
 *   message: "Rol actualizado correctamente.",
 *   data: { ...UserListItem }
 * }
 */
export interface ChangeUserRoleResponse {
  message: string;
  data: UserListItem;
}
