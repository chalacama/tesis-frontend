import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { InformationRequest, InformationResponse, UserInformation } from './information.interface';
import { catchError, map, Observable, throwError } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class InformationService {

  private apiUrl = `${environment.apiUrl}/profile/info`;
  constructor(private http: HttpClient) { }
  getUserProfile(): Observable<UserInformation> {
    return this.http.get<InformationResponse>(`${this.apiUrl}/show`).pipe(
      map(response => response.userInformation),
      catchError(error => {
        console.error('Error al obtener perfil:', error);
        return throwError(() => new Error('Error al obtener información del perfil'));
      })
    );
  }
  updateUserProfile(data: InformationRequest): Observable<UserInformation> {
  return this.http.put<InformationResponse>(`${this.apiUrl}/update`, data).pipe(
    map(response => response.userInformation),
    catchError(error => {
      console.error('Error al actualizar perfil:', error);
      return throwError(() => new Error('Error al actualizar la información del perfil'));
    })
  );
}
}
