// src/app/core/api/edu-level/edu-level.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../environment/environment';
import {
  ApiResponse,
  EduLevel,
  EduLevelAdmin,
  EduLevelAdminIndexResponse,
  EduLevelDeleteResponse,
  EduLevelIndexResponse,
  EduLevelPayload,
  EduLevelSaveResponse,
} from './edu-level.interface';

@Injectable({
  providedIn: 'root',
})
export class EduLevelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/edu-level`;

  /**
   * GET /edu-level/index
   * Index ligero: todos los niveles educativos sin filtros ni datos extra.
   */
  getAll(): Observable<EduLevel[]> {
    return this.http.get<EduLevelIndexResponse>(`${this.apiUrl}/index`).pipe(
      map((res) => res.data ?? []),
      catchError((err) =>
        this.handleError(err, 'obtener la lista de niveles educativos')
      )
    );
  }

  /**
   * GET /edu-level/index-admin
   * Index administrativo:
   *  - filtros opcionales: name, period, max_periods
   *  - paginación: page, per_page
   *  - datos extra: users_count, educational_units_count
   */
  getAdmin(params?: {
    page?: number;
    per_page?: number;
    name?: string;
    period?: string;
    max_periods?: number;
  }): Observable<EduLevelAdminIndexResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params?.page != null) queryParams['page'] = params.page;
    if (params?.per_page != null) queryParams['per_page'] = params.per_page;
    if (params?.name) queryParams['name'] = params.name;
    if (params?.period) queryParams['period'] = params.period;
    if (params?.max_periods != null)
      queryParams['max_periods'] = params.max_periods;

    return this.http
      .get<EduLevelAdminIndexResponse>(`${this.apiUrl}/index-admin`, {
        params: queryParams,
      })
      .pipe(
        catchError((err) =>
          this.handleError(err, 'obtener el listado administrativo')
        )
      );
  }

  /**
   * POST /edu-level/store
   * Crea un nuevo nivel educativo.
   */
  create(payload: EduLevelPayload): Observable<EduLevel> {
    return this.http
      .post<EduLevelSaveResponse>(`${this.apiUrl}/store`, payload)
      .pipe(
        map((res) => res.data as EduLevel),
        catchError((err) =>
          this.handleError(err, 'crear el nivel educativo')
        )
      );
  }

  /**
   * PUT /edu-level/{id}/update
   * Actualiza un nivel educativo existente.
   */
  update(id: number, payload: EduLevelPayload): Observable<EduLevel> {
    return this.http
      .put<EduLevelSaveResponse>(`${this.apiUrl}/${id}/update`, payload)
      .pipe(
        map((res) => res.data as EduLevel),
        catchError((err) =>
          this.handleError(err, 'actualizar el nivel educativo')
        )
      );
  }

  /**
   * DELETE /edu-level/{id}/destroy
   * Elimina un nivel educativo.
   */
  delete(id: number): Observable<EduLevelDeleteResponse> {
    return this.http
      .delete<EduLevelDeleteResponse>(`${this.apiUrl}/${id}/destroy`)
      .pipe(
        catchError((err) =>
          this.handleError(err, 'eliminar el nivel educativo')
        )
      );
  }

  /**
   * Manejo centralizado de errores:
   * - Mantiene el error original del backend (para leer "errors" de validación)
   * - Agrega friendlyMessage para mostrar en Toasts
   */
  private handleError(err: any, action: string) {
    const apiMessage: string | undefined = err?.error?.message;
    const friendlyMessage =
      apiMessage || `Error al ${action}. Intenta nuevamente.`;

    const wrappedError = {
      ...err,
      friendlyMessage,
    };

    return throwError(() => wrappedError);
  }
}

