import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { CourseRequest, CourseResponse } from './start.interfaces';
import { SuggestionResponse } from './suggestion.interface';

@Injectable({
  providedIn: 'root'
})
export class StartService {
  private apiUrl = `${environment.apiUrl}/start`;

  constructor(private http: HttpClient) {}

  /** Lista de cursos con filtros + término de búsqueda opcional (q) */
  getCoursesByFilter(request: CourseRequest): Observable<CourseResponse> {
    let params = new HttpParams()
      .set('filter', request.filter)
      .set('page', String(request.page))
      .set('per_page', String(request.per_page));

    if (request.q != null && request.q !== '') {
      params = params.set('q', request.q);
    }

    return this.http.get<CourseResponse>(`${this.apiUrl}/courses-by-filter`, { params });
  }

  /** Sugerencias: historial (si q vacío) + sugerencias generales (si q tiene texto) */
  getSuggestionByFilter(q: string, limit = 10): Observable<SuggestionResponse> {
    let params = new HttpParams().set('limit', String(limit));
    if (q != null) params = params.set('q', q);
    return this.http.get<SuggestionResponse>(`${this.apiUrl}/suggestion-by-filter`, { params });
  }

  /** Registrar/actualizar una búsqueda en el historial */
  updateSuggestion(text: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.apiUrl}/suggestion`, { text });
  }
}
