import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import {
  ApiMessageResponse,
  NotificationIndexResponse,
  UnreadCountResponse,
} from './notification.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // En Laravel las rutas quedaron como /api/notifications/...
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener notificaciones del usuario autenticado.
   * Soporta:
   *  - unreadOnly: solo no leídas
   *  - page: número de página (paginación Laravel)
   *  - perPage: cantidad por página
   */
  getNotifications(options?: {
    unreadOnly?: boolean;
    page?: number;
    perPage?: number;
  }): Observable<NotificationIndexResponse> {
    let params = new HttpParams();

    if (options?.unreadOnly) {
      params = params.set('unread_only', '1');
    }
    if (options?.page) {
      params = params.set('page', options.page.toString());
    }
    if (options?.perPage) {
      params = params.set('per_page', options.perPage.toString());
    }

    return this.http.get<NotificationIndexResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener solo el número de notificaciones no leídas.
   * Útil para el badge de la campanita.
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Marcar una notificación como leída.
   */
  markAsRead(id: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/${id}/read`, {});
  }

  /**
   * Marcar todas las notificaciones como leídas.
   */
  markAllAsRead(): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/read-all`, {});
  }
}

