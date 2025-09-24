import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Career, CareerResponse } from './career.interface';

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

}
