// src/app/core/api/carrer/career.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../environment/environment';
import {
  Career,
  CareerDeleteResponse,
  CareerItemResponse,
  CareerPayload,
  CareerResponse,
  CareerAdminListResponse,
  CareerAdminQuery
} from './career.interface';

@Injectable({
  providedIn: 'root'
})
export class CareerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/career`;
  private readonly adminApiUrl = `${this.apiUrl}/index-admin`;

  /**
   * GET /career/index
   * Lista simple de carreras (sin paginación)
   */
  getAll(): Observable<Career[]> {
    return this.http.get<CareerResponse>(`${this.apiUrl}/index`).pipe(
      map((res) => res.data ?? []),
      catchError((err) =>
        this.handleError(err, 'obtener la lista de carreras')
      )
    );
  }

  /**
   * GET /career/index-admin
   * Lista administrativa con:
   *  - filtros: name, max_semesters
   *  - paginación: page, per_page
   *  - datos extra: courses_count, users_count, sedes_count
   */
  getAdminList(
    query: CareerAdminQuery = {}
  ): Observable<CareerAdminListResponse> {
    let params = new HttpParams();

    if (query.name) {
      params = params.set('name', query.name);
    }
    if (query.max_semesters != null) {
      params = params.set('max_semesters', String(query.max_semesters));
    }
    if (query.page != null) {
      params = params.set('page', String(query.page));
    }
    if (query.per_page != null) {
      params = params.set('per_page', String(query.per_page));
    }

    return this.http
      .get<CareerAdminListResponse>(this.adminApiUrl, { params })
      .pipe(
        // devolvemos el objeto completo (data + meta)
        catchError((err) =>
          this.handleError(
            err,
            'obtener la lista administrativa de carreras'
          )
        )
      );
  }

  /**
   * POST /career/store
   * Crear nueva carrera
   */
  create(payload: CareerPayload): Observable<Career> {
    return this.http
      .post<CareerItemResponse>(`${this.apiUrl}/store`, payload)
      .pipe(
        map((res) => res.data as Career),
        catchError((err) => this.handleError(err, 'crear la carrera'))
      );
  }

  /**
   * PUT /career/{id}/update
   * Actualizar carrera
   */
  update(id: number, payload: CareerPayload): Observable<Career> {
    return this.http
      .put<CareerItemResponse>(`${this.apiUrl}/${id}/update`, payload)
      .pipe(
        map((res) => res.data as Career),
        catchError((err) => this.handleError(err, 'actualizar la carrera'))
      );
  }

  /**
   * DELETE /career/{id}/destroy
   * Eliminar carrera
   */
  delete(id: number): Observable<CareerDeleteResponse> {
    return this.http
      .delete<CareerDeleteResponse>(`${this.apiUrl}/${id}/destroy`)
      .pipe(
        catchError((err) => this.handleError(err, 'eliminar la carrera'))
      );
  }

  /**
   * Manejo centralizado de errores:
   * - Conserva el objeto original del backend (para leer errors de validación)
   * - Agrega un mensaje amigable que puedes usar en el Toast
   */
  private handleError(err: any, action: string) {
    const apiMessage: string | undefined = err?.error?.message;
    const friendlyMessage =
      apiMessage || `Error al ${action}. Intenta nuevamente.`;

    const wrappedError = {
      ...err,
      friendlyMessage
    };

    return throwError(() => wrappedError);
  }
}
