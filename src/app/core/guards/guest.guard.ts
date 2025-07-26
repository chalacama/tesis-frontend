// src/app/core/guards/guest.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../api/auth/auth.service';

export const guestGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser.pipe(
    take(1),
    map(user => {
      // Si el usuario existe, significa que está logueado
      if (user) {
        // Redirigir a la página principal de la app
        return router.createUrlTree(['/learning']);
      }
      
      // Si no hay usuario, permitir el acceso (a la página de login/registro)
      return true;
    })
  );
};