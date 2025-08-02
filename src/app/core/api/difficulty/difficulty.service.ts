import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Difficulty, DifficultyResponse } from './difficulty.interface';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DifficultyService {
  private readonly apiUrl = `${environment.apiUrl}/difficulty`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<Difficulty[]> {
    return this.http.get<DifficultyResponse>(`${this.apiUrl}/index`).pipe(
      map(response => response.difficulties),
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores con mensajes personalizados
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error al cargar las dificultades.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 403:
          errorMessage = 'No tienes permisos para ver las dificultades.';
          break;
        case 401:
          errorMessage = 'No estás autenticado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor.';
          break;
        default:
          errorMessage = error.error?.message || errorMessage;
      }
    }

    console.error('DifficultyService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
