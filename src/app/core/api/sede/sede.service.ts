import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sede, SedeResponse } from './sede.interface';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class SedeService {

  private readonly apiUrl = `${environment.apiUrl}/sede`;

  constructor(private http: HttpClient) {}

  getSedes(): Observable<Sede[]> {
    return this.http.get<SedeResponse>(`${this.apiUrl}/index`).pipe(
      map(response => response.sedes),
      catchError(error => {
        console.error('Error al obtener sedes:', error);
        return throwError(() => new Error('No se pudieron cargar las sedes'));
      })
    );
  }
}
