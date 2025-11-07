// core/api/watching/watching.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';

import { WatchingResponse } from './structure.interface';
import { ContentResponse } from './content.interface';
import { DetailResponse } from './detail.interface';
import {
  CommentResponse,
  RepliesResponse,
  PaginationParams,
  CreateCommentDto,
  SingleCommentResponse
} from './comment.interface';
import { AutosaveRequestDto, AutosaveResponse, TestIndexResponse, TestPageQuery, TestShowResponse } from './test.interface';

@Injectable({ providedIn: 'root' })
export class WatchingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/watching`;

  /** GET /watching/course/{course}/show */
  getCourseWatching(courseId: number | string): Observable<WatchingResponse> {
    return this.http.get<WatchingResponse>(`${this.apiUrl}/course/${courseId}/show`);
  }

  getChapterContent(chapterId: number | string): Observable<ContentResponse> {
    return this.http.get<ContentResponse>(`${this.apiUrl}/content/${chapterId}/show`);
  }

  /** GET /watching/detail/{course}/show */
  getCourseDetail(courseId: number | string): Observable<DetailResponse> {
    return this.http.get<DetailResponse>(`${this.apiUrl}/detail/${courseId}/show`);
  }

  /**
   * GET /watching/comment/{course}/index
   * Comentarios raíz del curso (scroll infinito)
   */
  getCourseComments(
    courseId: number | string,
    params?: PaginationParams
  ): Observable<CommentResponse> {
    const httpParams = new HttpParams({
      fromObject: {
        ...(params?.per_page ? { per_page: params.per_page } : {}),
        ...(params?.page ? { page: params.page } : {}),
      }
    });
    // Nota: la ruta de tu backend para index usa {course} antes de /index, sin /course/.
    return this.http.get<CommentResponse>(
      `${this.apiUrl}/comment/${courseId}/index`,
      { params: httpParams }
    );
  }

  /**
   * GET /watching/course/{course}/comment/{comment}/replies
   * Respuestas (todas las profundidades aplanadas tipo YouTube)
   */
  getCommentReplies(
    courseId: number | string,
    commentId: number | string,
    params?: PaginationParams
  ): Observable<RepliesResponse> {
    const httpParams = new HttpParams({
      fromObject: {
        ...(params?.per_page ? { per_page: params.per_page } : {}),
        ...(params?.page ? { page: params.page } : {}),
      }
    });
    return this.http.get<RepliesResponse>(
      `${this.apiUrl}/course/${courseId}/comment/${commentId}/replies`,
      { params: httpParams }
    );
  }

  /**
   * POST /watching/comment/{course}/store
   * Crea comentario raíz o respuesta (si envías parent_id)
   */
  createComment(
    courseId: number | string,
    payload: CreateCommentDto
  ): Observable<SingleCommentResponse> {
    return this.http.post<SingleCommentResponse>(
      `${this.apiUrl}/comment/${courseId}/store`,
      payload
    );
  }

  /**
   * Helper para seguir links de paginación absolutos (links.next, links.prev).
   * Útil cuando uses simplePaginate y quieras encadenar páginas tal cual.
   */
  getByLink<T>(absoluteUrl: string): Observable<T> {
    return this.http.get<T>(absoluteUrl);
  }


  /**
   * GET /watching/test/{chapter}/index
   * - Modo normal: muestra o crea el intento en curso.
   * - Modo review_last=true: muestra el último intento completado (si permitido).
   */
  // core/api/watching/watching.service.ts
getTestPage(
  chapterId: number,
  params?: TestPageQuery
): Observable<TestIndexResponse> {
  let httpParams = new HttpParams();
  if (params?.page != null)     httpParams = httpParams.set('page', params.page);
  if (params?.per_page != null) httpParams = httpParams.set('per_page', params.per_page);

  // ⬇️ Solo enviamos review_last si es TRUE (en review)
  if (params?.review_last === true) httpParams = httpParams.set('review_last', '1');

  const url = `${this.apiUrl}/test/${chapterId}/index`;
  return this.http.get<TestIndexResponse>(url, { params: httpParams });
}


  /**
   * GET /watching/test/{chapter}/show
   * Meta para el componente: títulos, conteos, attempts, flags y estado del usuario.
   */
  getTestShow(chapterId: number): Observable<TestShowResponse> {
    const url = `${this.apiUrl}/test/${chapterId}/show`;
    return this.http.get<TestShowResponse>(url);
  }

  /**
   * Autosave de respuestas (sin evaluar ni revelar correctas).
   * - Envía el conjunto completo de answer_ids seleccionadas para esa pregunta
   *   (modo replace).
   * - El backend valida que el TestView no esté completado.
   */
  autosaveAnswer(
    testViewId: number,
    payload: AutosaveRequestDto
  ): Observable<AutosaveResponse> {
    const url = `${this.apiUrl}/test/${testViewId}/update`;
    return this.http.post<AutosaveResponse>(url, payload);
  }
}
