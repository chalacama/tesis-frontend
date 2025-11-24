// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../api/auth/auth.service';

export const authGuard: CanActivateFn = (
  route,
  state
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser.pipe(
    take(1),
    map(user => {
      // 1) Si NO hay usuario → redirigir a /auth
      if (!user) {
        return router.createUrlTree(['/auth']);
      }

      // 2) Verificar si el perfil está COMPLETO
      const hasUserInfo = !!user.has_user_information;
      const hasEducational = !!user.has_educational_user;
      const hasCategoryInterest = !!user.has_user_category_interest;

      const needsPersonalize =
        !hasUserInfo || !hasEducational || !hasCategoryInterest;

      const targetUrl = state.url || '';

      // 3) Si necesita personalizar y NO está ya en /personalize → redirigir
      if (needsPersonalize && !targetUrl.startsWith('/personalize')) {
        return router.createUrlTree(['/personalize']);
      }

      // 4) Si todo bien → permitir acceso
      return true;
    })
  );
};
