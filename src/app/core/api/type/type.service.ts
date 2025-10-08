import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { TypeLarningContentResponse } from './type.interface';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TypeService {
  private apiUrl = `${environment.apiUrl}/type`;
  private readonly http = inject(HttpClient);
  
  getTypeLearningContentAll(): Observable<TypeLarningContentResponse[]> {
    return this.http.get<TypeLarningContentResponse[]>(this.apiUrl + '/index/learning-content').pipe(
      map((response: TypeLarningContentResponse[]) => response)
    );
  }
  getTypeQuestionAll(): Observable<TypeLarningContentResponse[]> {
    return this.http.get<TypeLarningContentResponse[]>(this.apiUrl + '/index/question').pipe(
      map((response: TypeLarningContentResponse[]) => response)
    );
  }
}
