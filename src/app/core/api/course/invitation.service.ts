// core/api/invitation/invitation.service.ts

import {
  HttpClient,
  HttpErrorResponse,
  HttpParams
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment/environment';
import {
  AcceptInvitationResponse,
  ApiMessageResponse,
  ChangeRolesResponse,
  CollaboratorShowResponse,
  DeleteOwnerResponse,
  InviteCollaboratorResponse,
  LeaveCourseResponse,
  ValidateInvitationResponse
} from './invitation.interface';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly http = inject(HttpClient);

  /** Rutas backend:
   *  - /collaborator/... (protegidas)
   *  - /invitation/accept (pública)
   */
  private readonly collaboratorUrl = `${environment.apiUrl}/collaborator`;
  private readonly apiUrl = `${environment.apiUrl}/invitation`;

  // ======================
  // COLLABORATOR / SHOW
  // ======================

  /**
   * GET /collaborator/{course}/show
   * Devuelve dueño, colaborador/invitación y flags de permisos.
   */
  getCollaboratorInfo(courseId: number): Observable<CollaboratorShowResponse> {
    const url = `${this.collaboratorUrl}/${courseId}/show`;
    return this.http
      .get<CollaboratorShowResponse>(url)
      .pipe(catchError(this.handleError));
  }

  // ======================
  // VALIDAR USUARIO INVITABLE
  // ======================

  /**
   * GET /collaborator/validate?query=...
   * Busca usuarios por email/username/nombre/apellido (solo tutores/admin).
   */
  validateUser(query: string): Observable<ValidateInvitationResponse> {
    const url = `${this.collaboratorUrl}/validate`;
    const params = new HttpParams().set('query', query);
    return this.http
      .get<ValidateInvitationResponse>(url, { params })
      .pipe(catchError(this.handleError));
  }

  // ======================
  // INVITAR COLABORADOR
  // ======================

  /**
   * POST /collaborator/{course}/store
   * Body: { email }
   */
  inviteCollaborator(
    courseId: number,
    email: string
  ): Observable<InviteCollaboratorResponse> {
    const url = `${this.collaboratorUrl}/${courseId}/store`;
    return this.http
      .post<InviteCollaboratorResponse>(url, { email })
      .pipe(catchError(this.handleError));
  }

  // ======================
  // ELIMINAR COLABORADOR
  // ======================

  /**
   * DELETE /collaborator/{course}/delete/{user}
   */
  deleteCollaborator(
    courseId: number,
    userId: number
  ): Observable<ApiMessageResponse> {
    const url = `${this.collaboratorUrl}/${courseId}/delete/${userId}`;
    return this.http
      .delete<ApiMessageResponse>(url)
      .pipe(catchError(this.handleError));
  }

  // ======================
  // ELIMINAR DUEÑO (ADMIN)
  // ======================

  /**
   * DELETE /collaborator/{course}/delete-owner/{user}
   * El admin quita al dueño y pasa a ser el nuevo dueño.
   */
  deleteOwner(
    courseId: number,
    userId: number
  ): Observable<DeleteOwnerResponse> {
    const url = `${this.collaboratorUrl}/${courseId}/delete-owner/${userId}`;
    return this.http
      .delete<DeleteOwnerResponse>(url)
      .pipe(catchError(this.handleError));
  }

  // ======================
  // LEAVE: SALIR DEL CURSO
  // ======================

  /**
   * DELETE /collaborator/{course}/leave
   * Si es colaborador: sale normal.
   * Si es dueño: solo si hay colaborador, al que se le transfiere el curso.
   */
  leaveCourse(courseId: number): Observable<LeaveCourseResponse> {
    const url = `${this.collaboratorUrl}/${courseId}/leave`;
    return this.http
      .delete<LeaveCourseResponse>(url)
      .pipe(catchError(this.handleError));
  }

  // ======================
  // CHANGE: INTERCAMBIAR ROLES
  // ======================

  /**
   * PUT /collaborator/{course}/change
   * Intercambia dueño <-> colaborador.
   */
  swapOwnerWithCollaborator(
    courseId: number
  ): Observable<ChangeRolesResponse> {
    const url = `${this.collaboratorUrl}/${courseId}/change`;
    return this.http
      .put<ChangeRolesResponse>(url, {})
      .pipe(catchError(this.handleError));
  }

  // ======================
  // CANCEL: CANCELAR INVITACIÓN
  // ======================

  /**
   * DELETE /collaborator/{course}/cancel/{invitation}
   * Marca la invitación como "expired".
   */
  cancelInvitation(
    courseId: number,
    invitationId: number
  ): Observable<ApiMessageResponse> {
    const url = `${this.collaboratorUrl}/${courseId}/cancel/${invitationId}`;
    return this.http
      .delete<ApiMessageResponse>(url)
      .pipe(catchError(this.handleError));
  }

  // ======================
  // ACEPTAR INVITACIÓN (PÚBLICA)
  // ======================

  /**
   * POST /invitation/accept
   * Body: { token }
   * No requiere autenticación.
   */
  acceptInvitation(
    token: string
  ): Observable<AcceptInvitationResponse> {
    const url = `${this.apiUrl}/accept`;
    return this.http
      .post<AcceptInvitationResponse>(url, { token })
      .pipe(catchError(this.handleError));
  }

  // ======================
  // MANEJO DE ERRORES
  // ======================

  private handleError(error: HttpErrorResponse) {
    // Aquí puedes personalizar logs o mapping de errores
    console.error('Invitation API error:', error);
    return throwError(() => error);
  }
}

