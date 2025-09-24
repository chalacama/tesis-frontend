import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { Course, CourseFilters, CourseQueryParams, CourseRequest, CourseResponse, CourseRouteParams } from './course.interfaces';
import { environment } from '../../environment/environment';
import { PortfolioResponse } from '../portfolio/portfolio.interface';
import { CodeResponse, CourseDetailRequest, CourseDetailResponse } from './course.details.interfaces';


@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/course`;

  // Estado de loading para mejor UX
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache simple para mejorar performance
  private cache = new Map<string, { data: CourseResponse; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  

getCourses(params: CourseQueryParams = {}, routeParams?: CourseRouteParams): Observable<CourseResponse> {
  const cacheKey = this.generateCacheKey({ ...params, ...routeParams });
  const cachedData = this.getCachedData(cacheKey);

  if (cachedData) {
    return new Observable(observer => {
      observer.next(cachedData);
      observer.complete();
    });
  }

  this.loadingSubject.next(true);

  let httpParams = this.buildHttpParams(params);

  if (routeParams?.username) {
    httpParams = httpParams.set('username', routeParams.username);
  }

  if (routeParams?.id) {
    httpParams = httpParams.set('id', routeParams.id.toString());
  }

  return this.http.get<CourseResponse>(`${this.apiUrl}/index`, { params: httpParams }).pipe(
    tap(response => this.setCachedData(cacheKey, response)),
    catchError(this.handleError),
    finalize(() => this.loadingSubject.next(false))
  );
}

  

  /**
   * Busca cursos por término de búsqueda
   */
  searchCourses(searchTerm: string, params: Omit<CourseQueryParams, 'search'> = {}): Observable<CourseResponse> {
    return this.getCourses({ ...params, search: searchTerm });
  }

  /**
   * Obtiene cursos con filtros específicos
   */
  getFilteredCourses(filters: CourseFilters, params: Omit<CourseQueryParams, 'filters'> = {}): Observable<CourseResponse> {
    return this.getCourses({ ...params, filters });
  }

  /**
   * Limpia el cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalida el cache para una clave específica
   */
  invalidateCache(params?: CourseQueryParams): void {
    if (params) {
      const cacheKey = this.generateCacheKey(params);
      this.cache.delete(cacheKey);
    } else {
      this.clearCache();
    }
  }

  /**
   * Construye los parámetros HTTP a partir de los parámetros de consulta
   */
  private buildHttpParams(params: CourseQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.per_page) {
      httpParams = httpParams.set('per_page', params.per_page.toString());
    }

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.filters) {
      // Convertir filtros a string para enviarlos como query parameters
      const filtersString = JSON.stringify(params.filters);
      httpParams = httpParams.set('filters', filtersString);
    }

    return httpParams;
  }

  /**
   * Genera una clave de cache basada en los parámetros
   */
  private generateCacheKey(params: CourseQueryParams): string {
    return JSON.stringify(params);
  }

  /**
   * Obtiene datos del cache si están disponibles y no han expirado
   */
  private getCachedData(cacheKey: string): CourseResponse | null {
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }
    return null;
  }

  /**
   * Guarda datos en el cache
   */
  private setCachedData(cacheKey: string, data: CourseResponse): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Maneja errores HTTP de forma consistente
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud inválida. Por favor, verifica los datos enviados.';
          break;
        case 401:
          errorMessage = 'No tienes autorización para acceder a este recurso.';
          break;
        case 403:
          errorMessage = 'No tienes permisos suficientes para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'El recurso solicitado no fue encontrado.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Datos de entrada inválidos.';
          break;
        case 429:
          errorMessage = 'Demasiadas solicitudes. Por favor, intenta más tarde.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, contacta al soporte.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('CourseService Error:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      timestamp: new Date().toISOString()
    });

    return throwError(() => new Error(errorMessage));
  };
  createCourse(courseData: CourseRequest
  ): Observable<Course> {
    this.loadingSubject.next(true);
    return this.http.post<{ course: Course }>(`${this.apiUrl}/store`, courseData)
      .pipe(
        finalize(() => this.loadingSubject.next(false)),
        catchError(this.handleError),
        // extrae solo el objeto 'course'
        switchMap(response => of(response.course))
      );
  }
  getPortfolioByUsername(username: string): Observable<PortfolioResponse> {
    return this.http.get<PortfolioResponse>(`${this.apiUrl}/${username}`);
  }
  getCourseDetail(courseParam: string | number): Observable<CourseDetailResponse> {
  this.loadingSubject.next(true);
  return this.http.get<CourseDetailResponse>(`${this.apiUrl}/${courseParam}/show`).pipe(
    finalize(() => this.loadingSubject.next(false)),
    catchError(this.handleError)
  );
}

  
generateCode(): Observable<string> {
    this.loadingSubject.next(true);
    return this.http
      .get<CodeResponse>(`${this.apiUrl}/generate-code`)
      .pipe(
        map(res => res.code),
        finalize(() => this.loadingSubject.next(false)),
        catchError(this.handleError)
      );
  }
  updateCourse(
    courseId: number | string,
    data: CourseDetailRequest,
    
  ) {
    const url = `${this.apiUrl}/${courseId}/update`;
    const fd = new FormData();

    // Helpers
    const appendIfDefined = (key: string, v: unknown) => {
      if (v === undefined) return;
      if (v === null) {
        // Si quieres limpiar 'code', puedes enviar string vacío o no enviar nada.
        // El backend tiene 'sometimes', así que si no lo envías, no cambia.
        // Si necesitas forzar null, podrías enviar '' y en backend interpretarlo.
        fd.append(key, '');
        return;
      }
      fd.append(key, String(v));
    };

    // Campos base
    appendIfDefined('title', data.title);
    appendIfDefined('description', data.description);
    if (data.private !== undefined) fd.append('private', data.private ? '1' : '0');
    if (data.enabled !== undefined) fd.append('enabled', data.enabled ? '1' : '0');
    appendIfDefined('difficulty_id', data.difficulty_id);
    if (data.code !== undefined) {
      // Si code === '', enviamos '', si quieres no tocar, no lo envíes
      fd.append('code', data.code ?? '');
    }

    // Carreras (ids)
    if (Array.isArray(data.careers)) {
      // El backend limita a 2; aquí recortamos por si acaso
      const careers = [...new Set(data.careers)];
      careers.forEach(id => fd.append('careers[]', String(id)));
    }

    // Categorías (ids o con order)
    if (Array.isArray(data.categories)) {
      // El backend limita a 4; recortamos
      const cats = data.categories;
      if (typeof cats[0] === 'number') {
        (cats as number[]).forEach(id => fd.append('categories[]', String(id)));
      } else {
        (cats as { id: number; order?: number }[]).forEach((c, i) => {
          fd.append(`categories[${i}][id]`, String(c.id));
          if (c.order !== undefined) {
            fd.append(`categories[${i}][order]`, String(c.order));
          }
        });
      }
    }

    // Miniatura (archivo)
    if (data.miniature) {
      fd.append('miniature', data.miniature);
    }

    return this.http.post<CourseDetailResponse>(url, fd).pipe(
      map(res => res),
      catchError((err: HttpErrorResponse) => {
        const msg =
          (err.error && (err.error.message || err.error.error)) ||
          err.message ||
          'Error actualizando el curso';
        return throwError(() => new Error(msg));
      })
    );
  }

}
