// core/api/chapter/chapter.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';
import {
  ChapterResponse,
  ChapterUpdateRequest,
  LearingContentResponse,
  LearningContentUpdate,
  QuestionFilters,
  QuestionResponse,
  QuestionUpdateRequest,
  QuestionUpdateResponse
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

  getQuestions(
    chapterId: number | string,
    filters?: Partial<QuestionFilters>
  ): Observable<QuestionResponse> {
    const defaults: QuestionFilters = {
      q: '',
      type_questions_id: null,
      order_by: 'spot',
      order_dir: 'asc',
      per_page: 15,
      include_correct: false,
      page: 1,
    };

    const f = { ...defaults, ...(filters || {}) };

    let params = new HttpParams()
      .set('per_page', String(f.per_page))
      .set('order_by', f.order_by)
      .set('order_dir', f.order_dir)
      .set('include_correct', String(f.include_correct));

    if (f.q && f.q.trim() !== '') params = params.set('q', f.q.trim());
    if (typeof f.type_questions_id === 'number') {
      params = params.set('type_questions_id', String(f.type_questions_id));
    }
    if (typeof f.page === 'number' && f.page > 0) {
      params = params.set('page', String(f.page));
    }

    return this.http.get<QuestionResponse>(
      `${this.apiUrl}/question/${chapterId}/index`,
      { params }
    );
  }
  // Guarda preguntas de un capítulo (crea/actualiza/borra en lote)
updateQuestions(
  chapterId: number | string,
  payload: QuestionUpdateRequest
): Observable<QuestionUpdateResponse> {
  return this.http.post<QuestionUpdateResponse>(
    `${this.apiUrl}/question/${chapterId}/update`,
    payload
  );
}



}
