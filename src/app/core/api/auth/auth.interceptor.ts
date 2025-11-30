// core/api/auth/auth.interceptor.ts

import {
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // Si no hay token (o está expirado), seguimos normal
  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token no válido / expirado / revocado
        authService.clearUserData();

        // Redirigir al login (ajusta la ruta si usas otra)
        router.navigate(['/auth'], {
          queryParams: { reason: 'session_expired' },
        });
      }

      return throwError(() => error);
    })
  );
};
