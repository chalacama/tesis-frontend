import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environment/environment';

import {
  AuthResponse,
  LoginRequest,
  User,
  GoogleLoginRequest
} from './auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl + '/auth';

  private currentUserSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);
  public currentUser: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  // LOGIN tradicional
  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  // LOGIN con Google (envías el token que te da Google)
  googleLoginWithToken(googleToken: string): Observable<AuthResponse> {
    const payload: GoogleLoginRequest = { token: googleToken };

    return this.http.post<AuthResponse>(`${this.apiUrl}/google/callback`, payload)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => this.clearUserData()),
        catchError(this.handleError)
      );
  }

  // --- Manejo de respuesta de login (email o Google) ---
  private handleAuthResponse(response: AuthResponse): void {
    // Fusionamos user + flags de la raíz para que SIEMPRE tengas los 3 campos
    const userWithFlags: User = {
      ...response.user,
      can_update_username: response.can_update_username,
      has_user_information:
        response.has_user_information ?? response.user.has_user_information,
      has_educational_user:
        response.has_educational_user ?? response.user.has_educational_user,
      has_user_category_interest:
        response.has_user_category_interest ??
        response.user.has_user_category_interest,
    };

    if (this.isBrowser) {
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(userWithFlags));
    }

    this.currentUserSubject.next(userWithFlags);
  }

  private clearUserData(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // En Laravel mandas message o error
      errorMessage =
        error.error?.message ||
        error.error?.error ||
        `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }

  // Inicialización (para SSR + hydration)
  init(): Promise<void> {
    return new Promise(resolve => {
      if (this.isBrowser) {
        const storedUser = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
          this.currentUserSubject.next(JSON.parse(storedUser));
        } else {
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
        }
      }
      resolve();
    });
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles?.some(r => r.name === roleName) ?? false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
    // --- NUEVO ---
  /**
   * Actualiza el usuario actual en memoria y en localStorage
   * sin necesidad de hacer login otra vez.
   */
  updateCurrentUser(partialUser: Partial<User>): void {
    const current = this.currentUserSubject.value;

    if (!current || !this.isBrowser) {
      return;
    }

    const updatedUser: User = {
      ...current,
      ...partialUser,
    };

    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

}