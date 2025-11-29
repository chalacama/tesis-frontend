// core/api/location/location.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Observable, map } from 'rxjs';
import {
  LocationItem,
  LocationListResponse,
} from './location.interfaces';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  /**
   * Base: https://tudominio/api/locations
   */
  private readonly apiUrl = `${environment.apiUrl}/locations`;

  constructor(private http: HttpClient) {}

  /**
   * GET /locations/provinces
   * Devuelve solo el array de provincias [ {id, name}, ... ]
   */
  getProvinces(): Observable<LocationItem[]> {
    return this.http
      .get<LocationListResponse>(`${this.apiUrl}/provinces`)
      .pipe(map((res) => res.data));
  }

  /**
   * GET /locations/provinces/{province}/cantons
   */
  getCantons(provinceId: number | string): Observable<LocationItem[]> {
    return this.http
      .get<LocationListResponse>(
        `${this.apiUrl}/provinces/${provinceId}/cantons`
      )
      .pipe(map((res) => res.data));
  }

  /**
   * GET /locations/provinces/{province}/cantons/{canton}/parishes
   */
  getParishes(
    provinceId: number | string,
    cantonId: number | string
  ): Observable<LocationItem[]> {
    return this.http
      .get<LocationListResponse>(
        `${this.apiUrl}/provinces/${provinceId}/cantons/${cantonId}/parishes`
      )
      .pipe(map((res) => res.data));
  }
}

