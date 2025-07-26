import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { User } from './auth.interfaces';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { isPlatformBrowser } from '@angular/common';
import { AuthResponse } from './auth.interfaces';
import { LoginRequest } from './auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl + '/auth';
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser: Observable<User | null> = this.currentUserSubject.asObservable();

  // 3. Agrega una propiedad para saber si estamos en el navegador
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    // 4. Inyecta PLATFORM_ID para identificar el entorno
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // 5. Asigna el valor booleano a la propiedad isBrowser
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Carga el usuario desde localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  // ... (tus métodos login, googleLogin, logout no necesitan cambios aquí) ...
  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload )
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

  private handleAuthResponse(response: AuthResponse): void {
    // Guarda en localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
    this.currentUserSubject.next(response.user);
  }

  private clearUserData(): void {
    // Limpia localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    // Obtiene el token desde localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    // Este método ya funciona correctamente porque depende de getToken()
    return !!this.getToken();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = error.error.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
  // NUEVO MÉTODO DE INICIALIZACIÓN
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
      // Resuelve la promesa para que Angular sepa que puede continuar
      resolve(); 
    });
  }
}
