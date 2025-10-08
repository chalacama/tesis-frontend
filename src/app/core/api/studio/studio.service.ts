import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { MiniatureResponse } from './studio.interface';
import { Observable } from 'rxjs';
import { PortfolioResponse } from '../profile/portfolio.interface';

@Injectable({
  providedIn: 'root'
})
export class StudioService {

  constructor() { }
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/studio`;

  getMiniature(courseId: number): Observable<MiniatureResponse> {
    return this.http.get<MiniatureResponse>(`${this.apiUrl}/${courseId}/show/miniature`);
  }
  getPortfolioByUsername(username: string): Observable<PortfolioResponse> {
    return this.http.get<PortfolioResponse>(`${this.apiUrl}/${username}`);
  }
}
