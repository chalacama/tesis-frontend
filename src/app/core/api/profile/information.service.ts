// core/api/profile/information.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  InformationRequest,
  InformationShowResponse,
  InformationUpdateResponse,
} from './information.interface';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class InformationService {
  /** Base: https://tudominio/api/profile/info */
  private readonly baseUrl = `${environment.apiUrl}/profile/info`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener la información personal del usuario autenticado.
   * GET /profile/info/show
   */
  show(): Observable<InformationShowResponse> {
    return this.http.get<InformationShowResponse>(`${this.baseUrl}/show`);
  }

  /**
   * Crear/actualizar información personal.
   * PUT /profile/info/update
   */
  update(payload: InformationRequest): Observable<InformationUpdateResponse> {
    return this.http.put<InformationUpdateResponse>(
      `${this.baseUrl}/update`,
      payload
    );
  }
}
