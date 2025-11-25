import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  throwError
} from 'rxjs';
import {
  Course,
  CourseFilters,
  CourseQueryParams,
  CourseRequest,
  CourseResponse,
  CourseRouteParams
} from './course.interfaces';
import { environment } from '../../environment/environment';
import { CodeResponse, CourseDetailRequest, CourseDetailResponse } from './course.details.interfaces';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/course`;

  // Estado de loading para mejor UX (skeletons)
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Obtener cursos con paginación, búsqueda y filtros.
   * Sin caché, el skeleton se encargará de la experiencia visual.
   */
  getCourses(
    params: CourseQueryParams = {},
    routeParams?: CourseRouteParams
  ): Observable<CourseResponse> {
    this.loadingSubject.next(true);

    let httpParams = this.buildHttpParams(params);

    if (routeParams?.username) {
      httpParams = httpParams.set('username', routeParams.username);
    }

    if (routeParams?.id) {
      httpParams = httpParams.set('id', routeParams.id.toString());
    }

    return this.http
      .get<CourseResponse>(`${this.apiUrl}/index`, { params: httpParams })
      .pipe(
        catchError(this.handleError),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Busca cursos por término de búsqueda
   */
  searchCourses(
    searchTerm: string,
    params: Omit<CourseQueryParams, 'search'> = {}
  ): Observable<CourseResponse> {
    return this.getCourses({ ...params, search: searchTerm });
  }

  /**
   * Obtiene cursos con filtros específicos
   */
  getFilteredCourses(
    filters: CourseFilters,
    params: Omit<CourseQueryParams, 'filters'> = {}
  ): Observable<CourseResponse> {
    return this.getCourses({ ...params, filters });
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
      const filters = params.filters;
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && `${value}` !== '') {
          httpParams = httpParams.set(`filters[${key}]`, String(value));
        }
      });
    }

    return httpParams;
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

  createCourse(courseData: CourseRequest): Observable<Course> {
    this.loadingSubject.next(true);
    return this.http.post<{ course: Course }>(`${this.apiUrl}/store`, courseData).pipe(
      finalize(() => this.loadingSubject.next(false)),
      catchError(this.handleError),
      // extrae solo el objeto 'course'
      switchMap(response => of(response.course))
    );
  }

  getCourseDetail(courseParam: string | number): Observable<CourseDetailResponse> {
    this.loadingSubject.next(true);
    return this.http
      .get<CourseDetailResponse>(`${this.apiUrl}/${courseParam}/show`)
      .pipe(
        finalize(() => this.loadingSubject.next(false)),
        catchError(this.handleError)
      );
  }

  generateCode(): Observable<string> {
    this.loadingSubject.next(true);
    return this.http.get<CodeResponse>(`${this.apiUrl}/generate-code`).pipe(
      map(res => res.code),
      finalize(() => this.loadingSubject.next(false)),
      catchError(this.handleError)
    );
  }

  updateCourse(
    courseId: number | string,
    data: CourseDetailRequest
  ): Observable<CourseDetailResponse> {
    const url = `${this.apiUrl}/${courseId}/update`;
    const fd = new FormData();

    const appendIfDefined = (key: string, v: unknown) => {
      if (v === undefined) return;
      if (v === null) {
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
      fd.append('code', data.code ?? '');
    }

    // Carreras (ids)
    if (Array.isArray(data.careers)) {
      const careers = [...new Set(data.careers)];
      careers.forEach(id => fd.append('careers[]', String(id)));
    }

    // Categorías
    if (Array.isArray(data.categories)) {
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
