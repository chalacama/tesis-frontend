// core/api/sede/sede.service.ts

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Sede,
  SedeResponse,
  SedePaginatedResponse,
  SedeAllFilters
} from './sede.interface';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environment/environment';



@Injectable({
  providedIn: 'root'
})
export class SedeService {

  private readonly apiUrl = `${environment.apiUrl}/sede`;

  constructor(private http: HttpClient) {}

  /**
   * Sedes visibles para el usuario actual (/sede/index).
   * Se usa para el panel normal (aplica reglas de dominio/rol).
   */
  getSedes(): Observable<Sede[]> {
    return this.http.get<SedeResponse>(`${this.apiUrl}/index`).pipe(
      map(response => response.sedes ?? []),
      catchError(error => {
        console.error('Error al obtener sedes:', error);
        return throwError(() => new Error('No se pudieron cargar las sedes'));
      })
    );
  }

  /**
   * Listado global de sedes con filtros y paginación (/sede/index-all).
   * Ideal para tablas de administración.
   */
  getAdminSedes(filters: SedeAllFilters = {}): Observable<SedePaginatedResponse> {
    let params = new HttpParams();

    if (filters.unitName) {
      params = params.set('unit_name', filters.unitName);
    }
    if (filters.provinceId != null) {
      params = params.set('province_id', String(filters.provinceId));
    }
    if (filters.cantonId != null) {
      params = params.set('canton_id', String(filters.cantonId));
    }
    if (filters.page != null) {
      params = params.set('page', String(filters.page));
    }
    if (filters.perPage != null) {
      params = params.set('per_page', String(filters.perPage));
    }

    return this.http
      .get<SedePaginatedResponse>(`${this.apiUrl}/index-admin`, { params })
      .pipe(
        catchError(error => {
          console.error('Error al obtener sedes (index-all):', error);
          return throwError(
            () => new Error('No se pudieron cargar las sedes (index-all)')
          );
        })
      );
  }
}
