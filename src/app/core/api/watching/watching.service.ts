import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';

import {
  WatchingResponse,
} from './structure.interface';
import { ContentResponse } from './content.interface';
import { DetailResponse } from './detail.interface';
import { CommentResponse, PaginationParams, RepliesResponse } from './comment.interface';

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

  /**
   * GET /watching/course/{courseId}/show
   * Devuelve el payload de showDetail (DetailResponse)
   */
  getCourseDetail(courseId: number | string): Observable<DetailResponse> {
    return this.http.get<DetailResponse>(`${this.apiUrl}/detail/${courseId}/show`);
  }

  /**
   * GET /watching/comment/{course}/index
   * Comentarios raíz del curso (scroll infinito)
   */
  getCourseComments(courseId: number | string, params?: PaginationParams): Observable<CommentResponse> {
    const httpParams = new HttpParams({ fromObject: {
      ...(params?.per_page ? { per_page: params.per_page } : {}),
      ...(params?.page ? { page: params.page } : {}),
    }});
    return this.http.get<CommentResponse>(`${this.apiUrl}/comment/${courseId}/index`, { params: httpParams });
  }

  /**
   * GET /watching/comment/{course}/comment/{comment}/replies
   * Respuestas a un comentario (también paginadas)
   */
  getCommentReplies(
    courseId: number | string,
    commentId: number | string,
    params?: PaginationParams
  ): Observable<RepliesResponse> {
    const httpParams = new HttpParams({ fromObject: {
      ...(params?.per_page ? { per_page: params.per_page } : {}),
      ...(params?.page ? { page: params.page } : {}),
    }});
    return this.http.get<RepliesResponse>(
      `${this.apiUrl}/course/${courseId}/comment/${commentId}/replies`,
      { params: httpParams }
    );
  }

}

