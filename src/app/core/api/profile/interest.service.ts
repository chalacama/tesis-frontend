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

  // 🔴 ANTES:
  // private readonly apiUrl = `${environment.apiUrl}/interest`;

  // ✅ AHORA: respeta el prefix 'profile/interest' de Laravel
  private readonly apiUrl = `${environment.apiUrl}/profile/interest`;

  /**
   * GET /profile/interest/show
   */
  show(): Observable<InterestResponse> {
    return this.http.get<InterestResponse>(`${this.apiUrl}/show`);
  }

  /**
   * PUT /profile/interest/update
   */
  update(payload: InterestUpdateRequest): Observable<InterestResponse> {
    return this.http.put<InterestResponse>(`${this.apiUrl}/update`, payload);
  }
}
