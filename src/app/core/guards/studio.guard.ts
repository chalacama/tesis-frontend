import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../api/auth/auth.service';
import { inject } from '@angular/core';

export const studioGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  const isTutor = user?.roles?.some(role => role.name === 'tutor');
  const isAdmin = user?.roles?.some(role => role.name === 'admin');

  if (authService.isAuthenticated() && (isTutor || isAdmin)) {
    return true;
  }

  // Redirigir al landing si no tiene permiso
  router.navigate(['**']);
  return false;
};
