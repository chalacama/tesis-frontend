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
}
