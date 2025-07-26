// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../api/auth/auth.service';

export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usamos el observable currentUser que ya tienes en tu servicio
  return authService.currentUser.pipe(
    // take(1) asegura que la suscripción se complete después de la primera emisión
    take(1),
    map(user => {
      // Si el usuario existe (no es null), está autenticado
      if (user) {
        return true; // Permitir acceso
      }
      
      // Si no hay usuario, redirigir a la página de login
      // Usar createUrlTree es la forma recomendada en guards funcionales
      return router.createUrlTree(['/auth']);
    })
  );
};