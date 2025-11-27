// core/api/user/role.interfaces.ts

/**
 * Rol individual (Spatie Role)
 * Responde a lo que devuelve Laravel en /role/index
 */
export interface RoleItem {
  id: number;
  name: string;
  guard_name: string;
}

/**
 * Estructura del JSON que retorna el backend:
 * {
 *   data: [ { id, name, guard_name }, ... ]
 * }
 */
export interface RoleListResponse {
  data: RoleItem[];
}
