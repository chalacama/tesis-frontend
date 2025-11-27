import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environment/environment';
import {
  UserListItem,
  UserListParams,
  PaginatedResponse,
  ChangeUserRoleResponse,
  ChangeUserRoleRequest,
} from './user.interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener usuarios con filtros, orden y paginación.
   * Hace GET a:  GET {apiUrl}/index
   *
   * Ejemplo:
   *  this.userService.getUsers({
   *    search: 'juan',
   *    role_id: 2,
   *    sort: 'recent',
   *    page: 1,
   *    per_page: 20
   *  })
   */
  getUsers(params: UserListParams = {}): Observable<PaginatedResponse<UserListItem>> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.role_id !== undefined && params.role_id !== null) {
      httpParams = httpParams.set('role_id', params.role_id.toString());
    }

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.per_page) {
      httpParams = httpParams.set('per_page', params.per_page.toString());
    }

    return this.http.get<PaginatedResponse<UserListItem>>(
      `${this.apiUrl}/index`,
      { params: httpParams }
    );
  }

   /**
   * Cambiar el rol de un usuario.
   * PUT {apiUrl}/{userId}/change-role
   *
   * Ejemplo de uso:
   * this.userService.changeUserRole(5, 2).subscribe(...)
   */
  changeUserRole(
    userId: number,
    roleId: number
  ): Observable<ChangeUserRoleResponse> {
    const body: ChangeUserRoleRequest = { role_id: roleId };

    return this.http.put<ChangeUserRoleResponse>(
      `${this.apiUrl}/${userId}/change-role`,
      body
    );
  }
}

