import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';

import {
  WatchingResponse,
} from './structure.interface';
import { ContentResponse } from './content.interface';
import { DetailResponse } from './detail.interface';

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

}

