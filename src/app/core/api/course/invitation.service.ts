// core/api/invitation/invitation.service.ts
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import {
  AcceptInvitationResponse,
  ApiMessageResponse,
  InvitationCreateResponse,
  InvitationValidateResponse
} from './invitation.interface';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/invitation`;

  /**
   * Buscar usuarios (tutores/admin) para invitarlos.
   * GET /invitation/validate?query=
   */
  validateUser(query: string): Observable<InvitationValidateResponse> {
    const params = new HttpParams().set('query', query.trim());

    return this.http
      .get<InvitationValidateResponse>(`${this.apiUrl}/validate`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Invitar COLABORADOR a un curso.
   * POST /invitation/{course}/store
   */
  inviteCollaborator(
    courseId: number | string,
    email: string
  ): Observable<InvitationCreateResponse> {
    return this.http
      .post<InvitationCreateResponse>(`${this.apiUrl}/${courseId}/store`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Invitar NUEVO DUEÑO del curso.
   * POST /invitation/{course}/owner
   */
  inviteOwner(
    courseId: number | string,
    email: string
  ): Observable<InvitationCreateResponse> {
    return this.http
      .post<InvitationCreateResponse>(`${this.apiUrl}/${courseId}/owner`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Archivar (eliminar lógicamente) un tutor del curso.
   * DELETE /invitation/{course}/tutor/{tutor}
   */
  archiveTutor(
    courseId: number | string,
    tutorId: number | string
  ): Observable<ApiMessageResponse> {
    return this.http
      .delete<ApiMessageResponse>(`${this.apiUrl}/${courseId}/tutor/${tutorId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Aceptar invitación por token.
   * POST /invitation/accept
   */
  acceptInvitation(token: string): Observable<AcceptInvitationResponse> {
    return this.http
      .post<AcceptInvitationResponse>(`${this.apiUrl}/accept`, { token })
      .pipe(catchError(this.handleError));
  }

  // Manejo de errores similar al de CourseService
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error de red
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud inválida. Verifica los datos enviados.';
          break;
        case 401:
          errorMessage = 'No estás autenticado o tu sesión ha expirado.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado o token inválido.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Datos de entrada inválidos.';
          break;
        default:
          errorMessage =
            error.error?.message ||
            `Error ${error.status}: ${error.statusText || 'Error desconocido'}`;
      }
    }

    console.error('InvitationService Error:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      timestamp: new Date().toISOString()
    });

    return throwError(() => new Error(errorMessage));
  }
}
