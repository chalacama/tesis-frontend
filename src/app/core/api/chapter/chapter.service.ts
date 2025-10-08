// core/api/chapter/chapter.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';
import {
  ChapterResponse,
  ChapterUpdateRequest,
  LearingContentResponse,
  LearningContentUpdate
} from './chapter.interface';

@Injectable({ providedIn: 'root' })
export class ChapterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chapter`;

  showChapter(chapterId: number | string): Observable<ChapterResponse> {
    return this.http.get<ChapterResponse>(`${this.apiUrl}/${chapterId}/show`);
  }

  // RUTA corregida para learning-content:
  showLearningContent(chapterId: number | string): Observable<LearingContentResponse> {
    return this.http.get<LearingContentResponse>(`${this.apiUrl}/learning-content/${chapterId}/show`);
    
  }

  // Update JSON (youtube)
  // core/api/chapter/chapter.service.ts
updateLearningContent(
  chapterId: number | string,
  payload: LearningContentUpdate | FormData
): Observable<LearingContentResponse> {

  // Si ya viene FormData, lo enviamos tal cual:
  if (payload instanceof FormData) {
    return this.http.post<LearingContentResponse>(
      `${this.apiUrl}/learning-content/${chapterId}/update`,
      payload
    );
  }

  // Si viene como objeto, construimos FormData (soporta file | url nullable)
  const fd = new FormData();
  fd.append('type_content_id', String(payload.type_content_id));
  // url puede ser string o '' o null
  if (payload.url !== undefined && payload.url !== null) {
    fd.append('url', payload.url);
  }
  if (payload.file) {
    fd.append('file', payload.file);
  }

  return this.http.post<LearingContentResponse>(
    `${this.apiUrl}/learning-content/${chapterId}/update`,
    fd
  );
}



  // (si también usarás preguntas aquí, agrega sus métodos luego)
  updateChapter(chapterId: number | string, payload: ChapterUpdateRequest): Observable<ChapterResponse> {
    return this.http.put<ChapterResponse>(`${this.apiUrl}/${chapterId}/update`, payload);
  }
}
