// src/app/services/category.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../environment/environment';
import {
  ApiResponse,
  Category,
  CategoryListResponse,
  CategoryDetailResponse,
  CategoryCreateDto,
  CategoryUpdateDto
} from './category.interface';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  // Base: .../api/category
  private readonly apiUrl = `${environment.apiUrl}/category`;

  /**
   * GET /category/index
   * Devuelve la lista de categorías ordenadas por nombre
   */
  getAll(): Observable<Category[]> {
    return this.http.get<CategoryListResponse>(`${this.apiUrl}/index`).pipe(
      map((res) => res.data ?? []),
      catchError((err) =>
        this.handleError(err, 'obtener la lista de categorías')
      )
    );
  }

  /**
   * POST /category/store
   * Crea una nueva categoría
   */
  create(payload: CategoryCreateDto): Observable<Category> {
    return this.http
      .post<CategoryDetailResponse>(`${this.apiUrl}/store`, payload)
      .pipe(
        map((res) => res.data as Category),
        catchError((err) =>
          this.handleError(err, 'crear la categoría')
        )
      );
  }

  /**
   * PUT /category/{id}/update
   * Actualiza una categoría existente
   */
  update(id: number, payload: CategoryUpdateDto): Observable<Category> {
    return this.http
      .put<CategoryDetailResponse>(`${this.apiUrl}/${id}/update`, payload)
      .pipe(
        map((res) => res.data as Category),
        catchError((err) =>
          this.handleError(err, 'actualizar la categoría')
        )
      );
  }

  /**
   * DELETE /category/{id}/destroy
   * Elimina (soft-delete) una categoría
   */
  delete(id: number): Observable<ApiResponse> {
    return this.http
      .delete<ApiResponse>(`${this.apiUrl}/${id}/destroy`)
      .pipe(
        catchError((err) =>
          this.handleError(err, 'eliminar la categoría')
        )
      );
  }

  /**
   * Manejo centralizado de errores:
   * - Conserva el objeto original del backend (para leer errors de validación)
   * - Agrega un mensaje amigable que puedes mostrar en un Toast
   */
  private handleError(err: any, action: string) {
    const apiMessage: string | undefined = err?.error?.message;
    const friendlyMessage =
      apiMessage || `Error al ${action}. Intenta nuevamente.`;

    // Adjuntamos un mensaje "friendly" pero sin perder el error original
    const wrappedError = {
      ...err,
      friendlyMessage,
    };

    return throwError(() => wrappedError);
  }
}
