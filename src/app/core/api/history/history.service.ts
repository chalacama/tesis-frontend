import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import {
  HistoryType,
  PaginatedResponse,
  HistoryItem,
} from './history.interface';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/profile/history`;

  /**
   * Obtiene /history/index por tipo y página.
   * Uso:
   *   historyService.index({ type: 'historial', page: 1 }).subscribe(...)
   */
  index(opts: { type: HistoryType; page?: number }): Observable<PaginatedResponse<HistoryItem>> {
    const params = new HttpParams()
      .set('type', opts.type)
      .set('page', String(opts.page ?? 1));

    return this.http
      .get<PaginatedResponse<HistoryItem>>(`${this.apiUrl}/index`, { params })
      .pipe(
        // Normaliza numéricos por si vienen como string
        map((res) => ({
          ...res,
          per_page: Number(res.per_page),
          current_page: Number(res.current_page),
          total: Number(res.total),
          data: res.data.map((item) => ({
            ...item,
            completion_percent: Number(item.completion_percent ?? 0),
          })),
        }))
      );
  }

  /**
   * Helper por conveniencia: trae la “siguiente página” a partir de la actual.
   * Útil en scroll infinito si llevas el page en el estado del componente.
   */
  nextPage(type: HistoryType, currentPage: number): Observable<PaginatedResponse<HistoryItem>> {
    return this.index({ type, page: currentPage + 1 });
  }
}
