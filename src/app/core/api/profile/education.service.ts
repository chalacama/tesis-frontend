// core/api/profile/education.service.ts

import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  EducationalRequest,
  EducationalResponse,
  EducationalUser
} from './education.interface';

@Injectable({
  providedIn: 'root'
})
export class EducationService {

  private apiUrl = `${environment.apiUrl}/profile/education`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la información educativa del perfil.
   * Puede ser null si el usuario aún no ha registrado nada.
   */
  getEducationalProfile(): Observable<EducationalUser | null> {
    return this.http.get<EducationalResponse>(`${this.apiUrl}/show`).pipe(
      map(response => response.educationalUser ?? null),
      catchError(error => {
        console.error('Error al obtener datos educativos:', error);
        return throwError(() => new Error('Error al obtener datos educativos'));
      })
    );
  }

  /**
   * Crea / actualiza la información educativa del usuario.
   */
  updateEducationalProfile(
    data: EducationalRequest
  ): Observable<EducationalUser> {
    return this.http
      .put<EducationalResponse>(`${this.apiUrl}/update`, data)
      .pipe(
        map(response => response.educationalUser as EducationalUser),
        catchError(error => {
          console.error('Error al actualizar datos educativos:', error);
          return throwError(
            () => new Error('Error al actualizar los datos educativos')
          );
        })
      );
  }
}
