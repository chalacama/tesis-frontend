// module.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModuleResponse, UpdateAllRequest, UpdateAllResponse } from './module.interface';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/module`;

  /**
   * course puede ser ID numérico o slug (si así está configurado el binding)
   */
  getByCourse(course: number | string): Observable<ModuleResponse[]> {
    return this.http.get<ModuleResponse[]>(`${this.apiUrl}/${course}/index`);
  }
  updateAll(payload: UpdateAllRequest): Observable<UpdateAllResponse> {
    return this.http.post<UpdateAllResponse>(`${this.apiUrl}/update`, payload);
  }
}

