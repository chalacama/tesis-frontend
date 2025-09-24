// src/app/services/category.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';


import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import { Category, CategoryResponse } from './category.interface';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  // Base: .../api/auth/category
  private readonly apiUrl = `${environment.apiUrl}/category`;

  /** GET /index -> lista de categorías */
  getAll(): Observable<Category[]> {
    return this.http.get<CategoryResponse>(`${this.apiUrl}/index`).pipe(
      map(res => res.data ?? []),
      catchError(err => {
        // Puedes centralizar este manejo en un HttpErrorHandler si prefieres
        const msg = err?.error?.message || 'Error obteniendo categorías';
        return throwError(() => new Error(msg));
      })
    );
  }
}

