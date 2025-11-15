import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { CourseRequest, CourseResponse } from './start.interfaces';
import { SuggestionResponse } from './suggestion.interface';
import {
  PortfolioCourseResponse,
  PortfolioRequest
} from './start-portfolio.interface';

@Injectable({
  providedIn: 'root'
})
export class StartService {
  private apiUrl = `${environment.apiUrl}/start`;

  constructor(private http: HttpClient) {}

  /**
   * HOME:
   * Lista de cursos con filtros generales
   * - filter: all | popular | best_rated | created | updated | recommended...
   * - q: término de búsqueda
   */
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

  /**
   * PORTAFOLIO:
   * Lista de cursos de un usuario por tipo (courses | collaborations)
   * - username: dueño del portafolio
   * - type: 'courses' | 'collaborations'
   * - filter: 'created' | 'popular' | 'best_rated'
   * - q: búsqueda por nombre de curso
   */
  getPortfolioByFilter(request: PortfolioRequest): Observable<PortfolioCourseResponse> {
    let params = new HttpParams()
      .set('username', request.username)
      .set('type', request.type)
      .set('filter', request.filter)
      .set('page', String(request.page))
      .set('per_page', String(request.per_page));

    if (request.q != null && request.q !== '') {
      params = params.set('q', request.q);
    }

    return this.http.get<PortfolioCourseResponse>(`${this.apiUrl}/portfolio-by-filter`, { params });
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

  // ===== Helpers específicos para el portafolio =====

  /** Cursos donde el usuario es dueño (para /portfolio/:username/courses) */
  getPortfolioCourses(
    username: string,
    page = 1,
    perPage = 6,
    filter: PortfolioRequest['filter'] = 'created',
    q?: string
  ): Observable<PortfolioCourseResponse> {
    const request: PortfolioRequest = {
      username,
      type: 'courses',
      filter,
      page,
      per_page: perPage,
      q,
    };
    return this.getPortfolioByFilter(request);
  }

  /** Cursos donde el usuario es colaborador (para /portfolio/:username/collaborations) */
  getPortfolioCollaborations(
    username: string,
    page = 1,
    perPage = 6,
    filter: PortfolioRequest['filter'] = 'created',
    q?: string
  ): Observable<PortfolioCourseResponse> {
    const request: PortfolioRequest = {
      username,
      type: 'collaborations',
      filter,
      page,
      per_page: perPage,
      q,
    };
    return this.getPortfolioByFilter(request);
  }
}
