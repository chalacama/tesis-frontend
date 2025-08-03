import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { PortfolioResponse } from './portfolio.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private apiUrl = `${environment.apiUrl}/portfolio`;

  constructor(private http: HttpClient) {}

  getPortfolioByUsername(username: string): Observable<PortfolioResponse> {
  return this.http.get<PortfolioResponse>(`${this.apiUrl}/${username}`);
}


}
