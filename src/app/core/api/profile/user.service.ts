// core/api/user/user.service.ts (o donde lo tengas)

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { environment } from '../../environment/environment';
import { AuthService } from '../auth/auth.service'; // ajusta la ruta según tu estructura
import {
  UpdateUsernameRequest,
  UpdateUsernameResponse,
  ValidateUsernameRequest,
  ValidateUsernameResponse
} from './user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/profile/user`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Actualiza el username del usuario autenticado.
   * Endpoint: PUT /profile/user/update
   */
  updateUsername(
    payload: UpdateUsernameRequest
  ): Observable<UpdateUsernameResponse> {
    return this.http
      .put<UpdateUsernameResponse>(`${this.apiUrl}/update`, payload)
      .pipe(
        tap(response => {
          // Si el backend respondió OK, sincronizamos el currentUser
          // Regla de negocio: acaba de cambiar el username => can_update_username = false
          this.authService.updateCurrentUser({
            username: response.username,
            can_update_username: false
          });
        }),
        catchError(this.handleError)
      );
  }

  // --- Manejo de errores local (similar al de AuthService) ---
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage =
        error.error?.message ||
        error.error?.error ||
        `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }


  validateUsername(
    payload:  ValidateUsernameRequest 
  ): Observable<{ message: string; is_available: boolean }> {
    return this.http
      .get<ValidateUsernameResponse>(`${this.apiUrl}/validate-username`, {
        params: { username: payload.username }
      })
      .pipe(catchError(this.handleError));
  }


}

