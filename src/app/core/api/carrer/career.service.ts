import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Career, CareerDeleteResponse, CareerItemResponse, CareerPayload, CareerResponse } from './career.interface';

import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CareerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/career`;
  
  getAll(): Observable<Career[]> {
      return this.http.get<CareerResponse>(`${this.apiUrl}/index`).pipe(
        map(res => res.data ?? []),
        catchError(err => {
          // Puedes centralizar este manejo en un HttpErrorHandler si prefieres
          const msg = err?.error?.message || 'Error obteniendo categorías';
          return throwError(() => new Error(msg));
        })
      );
    }

    create(payload: CareerPayload): Observable<Career> {
    return this.http.post<CareerItemResponse>(`${this.apiUrl}/store`, payload).pipe(
      map(res => res.data),
      catchError(err => {
        const msg = err?.error?.message || 'Error creando carrera';
        return throwError(() => new Error(msg));
      })
    );
  }

  // Actualizar carrera -> PUT /career/update/{id}
  // (asumiendo ruta: Route::put('/update/{career}', ...))
  update(id: number, payload: CareerPayload): Observable<Career> {
    return this.http.put<CareerItemResponse>(`${this.apiUrl}/update/${id}`, payload).pipe(
      map(res => res.data),
      catchError(err => {
        const msg = err?.error?.message || 'Error actualizando carrera';
        return throwError(() => new Error(msg));
      })
    );
  }

  // Eliminar carrera -> DELETE /career/destroy/{id}
  // (asumiendo ruta: Route::delete('/destroy/{career}', ...))
  delete(id: number): Observable<CareerDeleteResponse> {
    return this.http.delete<CareerDeleteResponse>(`${this.apiUrl}/destroy/${id}`).pipe(
      catchError(err => {
        const msg = err?.error?.message || 'Error eliminando carrera';
        return throwError(() => new Error(msg));
      })
    );
  }

}
