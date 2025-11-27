// core/api/dashboard/dashboard.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';

import {
  DashboardPanelResponse
} from './panel.interfaces';

import {
  DashboardAnalyticsResponse
} from './analytic.interfaces';

export interface DashboardDateFilter {
  date_from?: string; // 'YYYY-MM-DD'
  date_to?: string;   // 'YYYY-MM-DD'
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  /**
   * GET /api/dashboard/index
   * Dashboard global (admin / tutor)
   *
   * @param filters Opcional: { date_from, date_to }
   */
  getPanel(filters?: DashboardDateFilter) {
    let params = new HttpParams();

    if (filters?.date_from && filters?.date_to) {
      params = params
        .set('date_from', filters.date_from)
        .set('date_to', filters.date_to);
    }

    return this.http.get<DashboardPanelResponse>(`${this.apiUrl}/index`, {
      params
    });
  }

  /**
   * GET /api/dashboard/{courseId}/show
   * Analítica profunda de un curso
   *
   * @param courseId ID del curso
   * @param filters Opcional: { date_from, date_to }
   */
  getCourseAnalytics(courseId: number, filters?: DashboardDateFilter) {
    let params = new HttpParams();

    if (filters?.date_from && filters?.date_to) {
      params = params
        .set('date_from', filters.date_from)
        .set('date_to', filters.date_to);
    }

    return this.http.get<DashboardAnalyticsResponse>(
      `${this.apiUrl}/${courseId}/show`,
      { params }
    );
  }
}

