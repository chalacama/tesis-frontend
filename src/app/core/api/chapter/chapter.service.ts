// core/api/chapter/chapter.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';
import { ChapterResponse, ChapterUpdateRequest } from './chapter.interface';

@Injectable({ providedIn: 'root' })
export class ChapterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chapter`;

  show(chapterId: number | string): Observable<ChapterResponse> {
    return this.http.get<ChapterResponse>(`${this.apiUrl}/${chapterId}/show`);
  }

  update(chapterId: number | string, payload: ChapterUpdateRequest): Observable<ChapterResponse> {
    return this.http.put<ChapterResponse>(`${this.apiUrl}/${chapterId}/update`, payload);
  }
}

