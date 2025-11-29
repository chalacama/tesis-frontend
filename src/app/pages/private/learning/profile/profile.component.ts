import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../../core/api/auth/auth.service';
import { User } from '../../../../core/api/auth/auth.interfaces';

import { IconComponent } from '../../../../shared/UI/components/button/icon/icon.component';
import { LoadingBarComponent } from '../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../shared/UI/components/overlay/toast/toast.component';

import { UiToastService } from '../../../../shared/services/ui-toast.service';
import { UserService } from '../../../../core/api/user/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IconComponent,
    LoadingBarComponent,
    ToastComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {

  datosUsuario$!: Observable<User | null>;
  currentUser: User | null = null;

  // Username
  usernameForm!: FormGroup;
  editingUsername = false;

  // Carga / acciones
  savingUsername = false;
  validatingUsername = false;

  // Modal confirmación
  confirmVisible = false;

  constructor(
    private auth: AuthService,
    private fb: FormBuilder,
    private userService: UserService,
    private toast: UiToastService
  ) {}

  ngOnInit(): void {
    this.initUsernameForm();

    this.datosUsuario$ = this.auth.currentUser;

    this.datosUsuario$.subscribe(u => {
      this.currentUser = u;
      if (u && !this.editingUsername) {
        this.usernameForm.patchValue({ username: u.username || '' }, { emitEvent: false });
      }
    });
  }

  // ---------------------------------------------------------
  // Helpers de nombre completo / iniciales
  // ---------------------------------------------------------

  getFullName(u: User | null | undefined): string {
    if (!u) return '';
    const n = (u.name || '').trim();
    const ln = (u.lastname || '').trim();
    const full = [n, ln].filter(Boolean).join(' ');
    return full || (u.username || '');
  }

  getInitialsFromUser(u: User | null | undefined): string {
    if (!u) return 'U';
    const base = this.getFullName(u) || u.username || 'U';
    return base
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() || '')
      .join('') || 'U';
  }

  // ---------------------------------------------------------
  // Username: form + validación
  // ---------------------------------------------------------

  private initUsernameForm(): void {
    this.usernameForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-z0-9._]+$/)
        ]
      ]
    });

    // Normalizar a minúsculas sin espacios
    const ctrl = this.usernameForm.get('username');
    ctrl?.valueChanges.subscribe(value => {
      if (value == null) return;
      const normalized = String(value).toLowerCase().replace(/\s+/g, '');
      if (normalized !== value) {
        ctrl.setValue(normalized, { emitEvent: false });
      }
    });
  }

  canEditUsername(u: User | null | undefined): boolean {
    return !!u?.can_update_username;
  }

  startEditUsername(): void {
    if (!this.currentUser) return;

    if (!this.currentUser.can_update_username) {
      this.toast.add({
        severity: 'warn',
        summary: 'No permitido',
        message: 'Actualmente no puedes cambiar tu nombre de usuario.'
      });
      return;
    }

    this.editingUsername = true;
    this.usernameForm.reset({
      username: this.currentUser.username || ''
    });
    this.usernameForm.markAsPristine();
    this.usernameForm.markAsUntouched();
  }

  cancelEditUsername(): void {
    this.editingUsername = false;
    if (this.currentUser) {
      this.usernameForm.patchValue(
        { username: this.currentUser.username || '' },
        { emitEvent: false }
      );
    }
    this.usernameForm.markAsPristine();
    this.usernameForm.markAsUntouched();
  }

  hasUsernameError(type: string): boolean {
    const c = this.usernameForm.get('username');
    return !!c && c.touched && c.hasError(type);
  }

  onSaveUsernameClick(): void {
    if (!this.editingUsername) return;
    if (!this.currentUser) return;

    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.toast.add({
        severity: 'warn',
        summary: 'Validación',
        message: 'Revisa el nombre de usuario antes de continuar.'
      });
      return;
    }

    const newUsername = (this.usernameForm.value.username || '').trim();
    if (!newUsername) return;

    // Sin cambios
    if (newUsername === this.currentUser.username) {
      this.toast.add({
        severity: 'info',
        summary: 'Sin cambios',
        message: 'El nombre de usuario es el mismo que el actual.'
      });
      this.editingUsername = false;
      return;
    }

    if (!this.currentUser.can_update_username) {
      this.toast.add({
        severity: 'warn',
        summary: 'No permitido',
        message: 'Actualmente no puedes cambiar tu nombre de usuario.'
      });
      return;
    }

    // Primero validamos disponibilidad
    this.validatingUsername = true;

    (this.userService as any).validateUsername({ username: newUsername }).subscribe({
      next: (res: any) => {
        this.validatingUsername = false;

        if (!res.is_available) {
          this.usernameForm.get('username')?.setErrors({ notAvailable: true });
          this.toast.add({
            severity: 'warn',
            summary: 'No disponible',
            message: 'Ese nombre de usuario ya está en uso.'
          });
          return;
        }

        // Si pasa validación → modal de confirmación
        this.confirmVisible = true;
      },
      error: (err: any) => {
        this.validatingUsername = false;
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: err?.message || 'No se pudo validar el nombre de usuario.'
        });
      }
    });
  }

  onConfirmUsernameChange(): void {
    const newUsername = (this.usernameForm.value.username || '').trim();
    if (!newUsername) return;

    this.confirmVisible = false;
    this.savingUsername = true;

    (this.userService as any).updateUsername({ username: newUsername }).subscribe({
      next: (res: any)  => {
        this.savingUsername = false;
        this.editingUsername = false;

        // El UserService ya actualiza AuthService (username + can_update_username=false)
        this.usernameForm.patchValue(
          { username: res.username },
          { emitEvent: false }
        );

        this.toast.add({
          severity: 'primary',
          summary: 'Actualizado',
          message: 'Tu nombre de usuario se actualizó correctamente.'
        });
      },
      error: (err: any) => {
        this.savingUsername = false;
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: err?.message || 'No se pudo actualizar el nombre de usuario.'
        });
      }
    });
  }
}
