import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CountryCode } from './code.country';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CodeCountryService {

  /* private readonly url = 'https://gist.githubusercontent.com/gugazimmermann/6b046821c7c695270d4dee7acb6fa924/raw/b431ac7642ca76e16620fa172c77ec97ff21dada/phone-code-es.json'; */

  constructor(private http: HttpClient) {}

  /* getCountryCodes(): Observable<CountryCode[]> {
    return this.http.get<CountryCode[]>(this.url).pipe(
      catchError((error) => {
        console.error('Error al cargar códigos de país:', error);
        return throwError(() => new Error('No se pudieron cargar los países.'));
      })
    );
  } */
}
