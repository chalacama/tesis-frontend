// src/app/core/api/edu-unit/edu-unit.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../environment/environment';
import {
  ApiResponse,
  EduUnit,
  EduUnitAdmin,
  EduUnitAdminIndexResponse,
  EduUnitDeleteResponse,
  EduUnitIndexResponse,
  EduUnitPayload,
  EduUnitSaveResponse,
} from './edu-unit.interface';

@Injectable({
  providedIn: 'root',
})
export class EduUnitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/edu-unit`;

  /**
   * GET /edu-unit/index
   * Index ligero: todas las unidades educativas sin filtros ni datos extra.
   */
  getAll(): Observable<EduUnit[]> {
    return this.http.get<EduUnitIndexResponse>(`${this.apiUrl}/index`).pipe(
      map((res) => res.data ?? []),
      catchError((err) =>
        this.handleError(err, 'obtener la lista de unidades educativas')
      )
    );
  }

  /**
   * GET /edu-unit/index-admin
   * Index administrativo:
   *  - filtros opcionales: name, organization_domain
   *  - paginación: page, per_page
   *  - datos extra: sedes_count, users_count, educational_levels[]
   */
  getAdmin(params?: {
    page?: number;
    per_page?: number;
    name?: string;
    organization_domain?: string;
  }): Observable<EduUnitAdminIndexResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params?.page != null) queryParams['page'] = params.page;
    if (params?.per_page != null) queryParams['per_page'] = params.per_page;
    if (params?.name) queryParams['name'] = params.name;
    if (params?.organization_domain)
      queryParams['organization_domain'] = params.organization_domain;

    return this.http
      .get<EduUnitAdminIndexResponse>(`${this.apiUrl}/index-admin`, {
        params: queryParams,
      })
      .pipe(
        catchError((err) =>
          this.handleError(err, 'obtener el listado administrativo')
        )
      );
  }

  /**
   * POST /edu-unit/store
   * Crea una nueva unidad educativa con sus niveles asociados.
   */
  create(payload: EduUnitPayload): Observable<EduUnitSaveResponse['data']> {
    return this.http
      .post<EduUnitSaveResponse>(`${this.apiUrl}/store`, payload)
      .pipe(
        map((res) => res.data as EduUnitSaveResponse['data']),
        catchError((err) =>
          this.handleError(err, 'crear la unidad educativa')
        )
      );
  }

  /**
   * PUT /edu-unit/{id}/update
   * Actualiza una unidad educativa y sus niveles asociados.
   */
  update(
    id: number,
    payload: EduUnitPayload
  ): Observable<EduUnitSaveResponse['data']> {
    return this.http
      .put<EduUnitSaveResponse>(`${this.apiUrl}/${id}/update`, payload)
      .pipe(
        map((res) => res.data as EduUnitSaveResponse['data']),
        catchError((err) =>
          this.handleError(err, 'actualizar la unidad educativa')
        )
      );
  }

  /**
   * DELETE /edu-unit/{id}/destroy
   * Elimina una unidad educativa.
   */
  delete(id: number): Observable<EduUnitDeleteResponse> {
    return this.http
      .delete<EduUnitDeleteResponse>(`${this.apiUrl}/${id}/destroy`)
      .pipe(
        catchError((err) =>
          this.handleError(err, 'eliminar la unidad educativa')
        )
      );
  }

  /**
   * Manejo centralizado de errores:
   * - Mantiene el error original del backend (para leer "errors" de validación)
   * - Agrega un mensaje amigable (friendlyMessage) para mostrar en Toasts
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

