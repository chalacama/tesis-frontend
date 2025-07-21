import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../api/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    router.navigate(['/auth'], {
      queryParams: { returnUrl: state.url }  // opcional: para redirigir luego del login
    });
  }

  return isAuthenticated;
};
