import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { Course, CourseRequest, CourseResponse } from './start.interfaces';
@Injectable({
  providedIn: 'root'
})
export class StartService {

  private apiUrl = `${environment.apiUrl}/start`;

  constructor(private http: HttpClient) {}

  getCoursesByFilter(request: CourseRequest): Observable<CourseResponse> {
  return this.http.get<CourseResponse>(`${this.apiUrl}/courses-by-filter`, {
    params: {
      filter: request.filter,
      page: request.page,
      per_page: request.per_page
    }
  });
}

}
