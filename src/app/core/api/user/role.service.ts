import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environment/environment';
import { RoleItem, RoleListResponse } from './role.interfaces';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private apiUrl = `${environment.apiUrl}/role`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los roles.
   * GET {apiUrl}/index  ->  /role/index
   *
   * Devuelve directamente RoleItem[] (ya hace map de response.data)
   */
  getRoles(): Observable<RoleItem[]> {
    return this.http
      .get<RoleListResponse>(`${this.apiUrl}/index`)
      .pipe(
        map((response) => response.data)
      );
  }
}

