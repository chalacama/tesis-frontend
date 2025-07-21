import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Inyecta el servicio usando la función inject()
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 2. Si no hay token, continúa sin modificar la petición
  if (!token) {
    return next(req);
  }

  // 3. Si hay token, clona la petición y añade el encabezado
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  // 4. Pasa la petición clonada al siguiente manejador
  return next(authReq);
};
