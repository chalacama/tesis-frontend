import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './core/api/auth/auth.interceptor';
import { AuthService } from './core/api/auth/auth.service'; // si lo tienes en otro archivo, ajusta ruta
export function initializeApp(authService: AuthService) {
  return (): Promise<void> => { 
    return authService.init(); 
  };
}
import {
  SocialLoginModule,
  SocialAuthServiceConfig,
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  GoogleInitOptions
} from '@abacritt/angularx-social-login';

const googleLoginOptions: GoogleInitOptions = {
  oneTapEnabled: false,
  scopes: 'profile email'
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),

    // Inicializador de la app (Auth)
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    },

    // Módulos de Social Login
    importProvidersFrom(SocialLoginModule, GoogleSigninButtonModule),

    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        lang: 'es',
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '733029118181-roa45uatn4u6gh6enhff21k6ecvicg1b.apps.googleusercontent.com',
              googleLoginOptions
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
