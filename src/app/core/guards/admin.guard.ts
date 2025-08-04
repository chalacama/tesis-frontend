import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../api/auth/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica si está autenticado y si tiene rol 'admin'
  if (authService.isAuthenticated() && authService.hasRole('admin')) {
    return true;
  }

  // Redirige si no tiene acceso
  router.navigate(['**']);
  return false;
};
