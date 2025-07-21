import { CanActivateFn } from '@angular/router';
import { AuthService } from '../api/auth/auth.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    router.navigate(['/learning']);
    return false;
  }

  return true;
};
