// core/api/profile/interest.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environment/environment';
import {
  InterestResponse,
  InterestUpdateRequest
} from './interest.interface';

@Injectable({
  providedIn: 'root'
})
export class InterestService {
  private readonly http = inject(HttpClient);
  // Base: .../api/interest
  private readonly apiUrl = `${environment.apiUrl}/interest`;

  /**
   * GET /interest/show
   * Obtiene las categorías de interés del usuario autenticado.
   */
  show(): Observable<InterestResponse> {
    return this.http.get<InterestResponse>(`${this.apiUrl}/show`);
  }

  /**
   * PUT /interest/update
   * Actualiza las 4 categorías de interés del usuario.
   */
  update(payload: InterestUpdateRequest): Observable<InterestResponse> {
    return this.http.put<InterestResponse>(`${this.apiUrl}/update`, payload);
  }
}
