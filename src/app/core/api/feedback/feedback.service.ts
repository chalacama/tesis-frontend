// core/api/feedback/feedback.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';
import {
  ContendRequest,
  ContendResponse,
  LikedRequest, LikeResponse,
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

  /** POST /feedback/saved/{course}/update */
  saveCourse(courseId: number | string, body: SavedRequest): Observable<SavedResponse> {
    return this.http.post<SavedResponse>(`${this.apiUrl}/saved/${courseId}/update`, body);
  }

  // Azúcar sintáctico opcional
  setLiked(chapterId: number | string, liked: boolean) {
    return this.likeChapter(chapterId, { liked });
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

}
