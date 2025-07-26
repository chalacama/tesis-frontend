import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './core/api/auth/auth.interceptor';

import { AuthService } from './core/api/auth/auth.service';
// --- NUESTRA FUNCIÓN FACTORY PARA EL INICIALIZADOR ---
export function initializeApp(authService: AuthService) {
  return (): Promise<void> => { // La función ahora devuelve una Promise
    return authService.init(); // Retornamos la promesa
  };
}
import { SocialLoginModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    },
    // --- PROVIDERS PARA GOOGLE SOCIAL LOGIN ---
    importProvidersFrom(SocialLoginModule),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false, // Es mejor manejar el login manualmente
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com' // <-- ¡IMPORTANTE! Reemplaza esto
            )
          }
        ],
        onError: (err) => {
          console.error('Error en SocialAuthService:', err);
        }
      } as SocialAuthServiceConfig,
    }
  ],
};
