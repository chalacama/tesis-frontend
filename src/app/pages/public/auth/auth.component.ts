import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router'
import { AuthService } from '../../../core/api/auth/auth.service';
import { CommonModule } from '@angular/common';
import { LoginRequest } from '../../../core/api/auth/interfaces/login-request';
@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  loginForm: FormGroup;
  showPassword = false;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  const payload: LoginRequest = this.loginForm.value;

  this.authService.login(payload).subscribe({
    next: () => {
      this.isLoading = false;
      console.log('Logeo exitoso');
      this.router.navigate(['/learning']);
    },
    error: (error) => {
      this.isLoading = false;
      this.errorMessage = error.message;
    }
  });
}

  googleLogin(): void {
    // Implementar la lógica para Google Sign-In
    // Por ejemplo, usando @abacritt/angularx-social-login
    // Esto requeriría configuración adicional
  }
}
