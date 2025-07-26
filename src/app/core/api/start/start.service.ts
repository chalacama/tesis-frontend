import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { Course } from './start.interfaces';
@Injectable({
  providedIn: 'root'
})
export class StartService {

  private apiUrl = `${environment.apiUrl}/start`;

  constructor(private http: HttpClient) {}

  getRecommendedCourses(): Observable<Course[]> {
    return this.http
      .get<{ courses: Course[] }>(`${this.apiUrl}/recommend-courses`)
      .pipe(map(res => res.courses));
  }
  getTopBestRatedCourses(): Observable<Course[]> {
    return this.http
      .get<{ courses: Course[] }>(`${this.apiUrl}/top-best-rated-courses`)
      .pipe(map(res => res.courses));
  }
  getTopPopularCourses(): Observable<Course[]> {
    return this.http
      .get<{ courses: Course[] }>(`${this.apiUrl}/top-popular-courses`)
      .pipe(map(res => res.courses));
  }
  getTopCreatedCourses(): Observable<Course[]> {
    return this.http
      .get<{ courses: Course[] }>(`${this.apiUrl}/top-created-courses`)
      .pipe(map(res => res.courses));
  }
}
