import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { MiniatureResponse } from './miniature.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MiniatureService {

  constructor() { }
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/miniature`;

  getMiniature(courseId: number): Observable<MiniatureResponse> {
    return this.http.get<MiniatureResponse>(`${this.apiUrl}/${courseId}/show`);
  }
}
