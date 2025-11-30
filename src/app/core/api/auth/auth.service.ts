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

  // Claves para localStorage
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'currentUser';
  private readonly EXPIRES_KEY = 'token_expires_at'; // 👈 nuevo

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      const storedUser = localStorage.getItem(this.USER_KEY);
      const token = localStorage.getItem(this.TOKEN_KEY);
      const expiresAt = localStorage.getItem(this.EXPIRES_KEY);

      if (storedUser && token && !this.isTokenExpired(expiresAt)) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } else {
        this.clearUserData();
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

  // LOGIN con Google
  googleLoginWithToken(googleToken: string): Observable<AuthResponse> {
    const payload: GoogleLoginRequest = { token: googleToken };

    return this.http.post<AuthResponse>(`${this.apiUrl}/google/callback`, payload)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  logout(): Observable<any> {
    // Aunque el token esté expirado y el backend responda 401,
    // queremos limpiar localmente igual.
    return this.http.post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => this.clearUserData()),
        catchError(err => {
          this.clearUserData();
          return this.handleError(err);
        })
      );
  }

  // --- Manejo de respuesta de login (email o Google) ---
  private handleAuthResponse(response: AuthResponse): void {
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
      localStorage.setItem(this.TOKEN_KEY, response.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userWithFlags));

      // Guardar la expiración si viene desde el backend
      if (response.expires_at) {
        const expiresAtMs = new Date(response.expires_at).getTime();
        localStorage.setItem(this.EXPIRES_KEY, expiresAtMs.toString());
      } else {
        // Si por algo no viene, limpiamos la marca para que isTokenExpired la considere inválida
        localStorage.removeItem(this.EXPIRES_KEY);
      }
    }

    this.currentUserSubject.next(userWithFlags);
  }

  // 👇 AHORA ES PÚBLICO: lo usará el interceptor también
  public clearUserData(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.EXPIRES_KEY);
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;

    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);

    if (!token || this.isTokenExpired(expiresAt)) {
      // Si ya expiró, limpiamos todo
      this.clearUserData();
      return null;
    }

    return token;
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;

    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);

    return !!token && !this.isTokenExpired(expiresAt);
  }

  // Comprueba si el timestamp almacenado ya pasó
  private isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) {
      // Si no hay fecha, consideramos que está inválido para ser estrictos
      return true;
    }

    const expires = Number(expiresAt);
    if (Number.isNaN(expires)) return true;

    return Date.now() >= expires;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
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
        const storedUser = localStorage.getItem(this.USER_KEY);
        const token = localStorage.getItem(this.TOKEN_KEY);
        const expiresAt = localStorage.getItem(this.EXPIRES_KEY);

        if (storedUser && token && !this.isTokenExpired(expiresAt)) {
          this.currentUserSubject.next(JSON.parse(storedUser));
        } else {
          this.clearUserData();
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

    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }
}
