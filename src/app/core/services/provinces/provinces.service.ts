import { Injectable } from '@angular/core';
import { Provincia, RawProvinciaData } from './provinces.interface';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProvincesService {

  private readonly jsonPath = 'json/provincias.json';

  constructor(private http: HttpClient) {}

  getProvincias(): Observable<Provincia[]> {
    return this.http.get<RawProvinciaData>(this.jsonPath).pipe(
      map((data) =>
        Object.entries(data || {}).map(([provId, provValue]) => ({
          id: provId,
          nombre: provValue.provincia,
          cantones: Object.entries(provValue.cantones || {}).map(
            ([cantonId, cantonValue]) => ({
              id: cantonId,
              nombre: cantonValue.canton,
              parroquias: Object.entries(cantonValue.parroquias || {}).map(
                ([parrId, parrName]) => ({
                  id: parrId,
                  nombre: parrName
                })
              )
            })
          )
        }))
      )
    );
  }
}
