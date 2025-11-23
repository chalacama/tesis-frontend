import {
  ApplicationRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { AuthService } from '../../../core/api/auth/auth.service';
import { LoginRequest } from '../../../core/api/auth/auth.interfaces';

import {
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  SocialAuthService,
  SocialUser
} from '@abacritt/angularx-social-login';

import { filter, first } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, GoogleSigninButtonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  errorMessage: string | null = null;
  isLoading = false;
  isGoogleLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private router: Router,
    private appRef: ApplicationRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.appRef.isStable
        .pipe(first(isStable => isStable === true))
        .subscribe(() => {
          document.body.classList.remove('app-loading');
        });

      // Cuando Google termina el login, nos notifica por aquí
      this.socialAuthService.authState
        .pipe(filter((user: SocialUser | null) => !!user))
        .subscribe((user: SocialUser | null) => {
          if (user) {
            this.handleGoogleUser(user);
          }
        });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;

    const payload: LoginRequest = this.loginForm.value;

    this.authService.login(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/learning']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      },
    });
  }

  // Se dispara cuando Google termina de autenticarse (ventanita de Google)
private handleGoogleUser(socialUser: SocialUser): void {
  if (!isPlatformBrowser(this.platformId)) return;

  this.errorMessage = null;
  this.isGoogleLoading = true;
  this.isLoading = true;

  // DEBUG: Mira en consola qué token estamos enviando
  console.log('Usuario recibido de Google:', socialUser);
  console.log('Token ID:', socialUser.idToken); 

  // Socialite suele funcionar mejor con el idToken para autenticación.
  // Si tu backend espera 'token', enviamos el idToken que ya viene listo.
  const tokenToSend = socialUser.idToken; 

  if (!tokenToSend) {
      this.errorMessage = 'No se recibió token de Google';
      this.isGoogleLoading = false;
      this.isLoading = false;
      return;
  }

  // Enviamos directamente el token que ya tenemos
  this.authService.googleLoginWithToken(tokenToSend).subscribe({
    next: (res) => {
      console.log('Login exitoso en Backend:', res);
      this.isGoogleLoading = false;
      this.isLoading = false;
      this.router.navigate(['/learning']);
    },
    error: (error) => {
      console.error('Error en Backend:', error);
      this.isGoogleLoading = false;
      this.isLoading = false;
      this.errorMessage = error.message || 'Error al iniciar sesión con Google.';
    },
  });
}
}