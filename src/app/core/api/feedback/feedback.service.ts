// core/api/feedback/feedback.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';
import {
  CompletedContentRequest,
  CompletedContentResponse,
  ContendRequest,
  ContendResponse,
  EmptyBody,
  LikedCommentRequest,
  LikedCommentResponse,
  LikedRequest, LikeResponse,
  RegisterCourseByCodeRequest,
  RegisterCourseRequest,
  RegisterCourseResponse,
  SavedRequest, SavedResponse
} from './feedback.interface';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/feedback`;

  /** POST /feedback/like/{chapter}/update */
  likeChapter(chapterId: number | string, body: LikedRequest): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/like/${chapterId}/update`, body);
  }
   likeComment(commentId: number | string, body: LikedCommentRequest): Observable<LikedCommentResponse> {
    return this.http.post<LikedCommentResponse>(`${this.apiUrl}/comment/${commentId}/update`, body);
  }
  /** POST /feedback/saved/{course}/update */
  saveCourse(courseId: number | string, body: SavedRequest): Observable<SavedResponse> {
    return this.http.post<SavedResponse>(`${this.apiUrl}/saved/${courseId}/update`, body);
  }

  // Azúcar sintáctico opcional
  setLiked(chapterId: number | string, liked: boolean) {
    return this.likeChapter(chapterId, { liked });
  }
  setLikedComment(commentId: number | string, liked: boolean) {
    // ⬅️ FIX: ahora sí llama a likeComment
    return this.likeComment(commentId, { liked });
  }
  setSaved(courseId: number | string, saved: boolean) {
    return this.saveCourse(courseId, { saved });
  }
  setContent(learningContentId: number | string, second_seen: number) {
    return this.updateContent(learningContentId, { second_seen });
  }
  // core/api/feedback/feedback.service.ts
updateContent(learningContentId: number | string, body: ContendRequest): Observable<ContendResponse> {
 
  return this.http.post<ContendResponse>(`${this.apiUrl}/content/${learningContentId}/update`, body);
}

/** POST /feedback/completed/content/{chapter}/update  (delta %) */
  updateCompletedContent(chapterId: number | string, body: CompletedContentRequest): Observable<CompletedContentResponse> {
    return this.http.post<CompletedContentResponse>(`${this.apiUrl}/completed/content/${chapterId}/update`, body);
  }

  /** Azúcar sintáctico */
  setCompletedContentDelta(chapterId: number | string, delta: number) {
    return this.updateCompletedContent(chapterId, { delta });
  }

  /**
   * Inscribirse SIN código (curso público y activo)
   * POST /feedback/register/{course}/store
   */
  registerToCourse(
    courseId: number | string,
    body: RegisterCourseRequest = {} as EmptyBody
  ) {
    return this.http.post<RegisterCourseResponse>(
      `${this.apiUrl}/register/${courseId}/store`,
      body
    );
  }

  /**
   * Inscribirse CON código (curso privado y activo)
   * POST /feedback/code/store
   */
  registerToCourseByCode(body: RegisterCourseByCodeRequest) {
    return this.http.post<RegisterCourseResponse>(
      `${this.apiUrl}/code/store`,
      body
    );
  }

  /** Azúcar sintáctico */
  enrollPublic(courseId: number | string) {
    return this.registerToCourse(courseId);
  }

  enrollPrivate(code: string) {
    return this.registerToCourseByCode({ code });
  }

}
