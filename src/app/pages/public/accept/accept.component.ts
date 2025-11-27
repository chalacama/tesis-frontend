import {
  Component,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { AvatarComponent } from '../../../shared/UI/components/media/avatar/avatar.component';

import {
  AcceptInvitationResponse,
  AcceptInvitationSuccessResponse,
  BasicUser,
} from '../../../core/api/course/invitation.interface';
import { InvitationService } from '../../../core/api/course/invitation.service';

type AcceptState = 'loading' | 'success' | 'user_not_found' | 'error';

@Component({
  selector: 'app-accept',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './accept.component.html',
  styleUrl: './accept.component.css',
})
export class AcceptComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invitationService = inject(InvitationService);

  // Estado
  state = signal<AcceptState>('loading');
  message = signal<string>('');
  data = signal<AcceptInvitationSuccessResponse | null>(null);
  userNotFoundEmail = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('error');
      this.message.set('El enlace de invitación no es válido o le falta el token.');
      return;
    }

    this.acceptInvitation(token);
  }

  private acceptInvitation(token: string): void {
    this.state.set('loading');
    this.message.set('');

    this.invitationService.acceptInvitation(token).subscribe({
      next: (res: AcceptInvitationResponse) => {
        // Caso: usuario no existe aún
        if ('status' in res && res.status === 'user_not_found') {
          this.state.set('user_not_found');
          this.message.set(res.message);
          this.userNotFoundEmail.set(res.email);
          return;
        }

        // Caso éxito con datos del curso y usuarios
        const success = res as AcceptInvitationSuccessResponse;
        this.data.set(success);
        this.state.set('success');
        this.message.set(success.message);
      },
      error: (err) => {
        console.error('Error al aceptar invitación', err);
        const msg =
          err?.error?.message ||
          err?.message ||
          'No se pudo procesar la invitación.';
        this.state.set('error');
        this.message.set(msg);
      },
    });
  }

  // Navegaciones
  goToInviterPortfolio(user: BasicUser | null): void {
    if (!user?.username) return;
    this.router.navigate([
      '/learning/portfolio',
      '@' + user.username,
      'courses',
    ]);
  }

  goToInvitedPortfolio(user: BasicUser | null): void {
    if (!user?.username) return;
    this.router.navigate([
      '/learning/portfolio',
      '@' + user.username,
      'collaborations',
    ]);
  }

  goToCourse(): void {
    const d = this.data();
    if (!d?.course) return;

    // Aquí asumo que tienes slug + id, como en tu ejemplo:
    // /learning/course/laravel-b-sico/1
    // Si en la respuesta solo tienes id y title, puedes ajustar esta parte.
    const slug = this.slugify(d.course.title);
    this.router.navigate([
      '/learning/course',
      slug,
      d.course.id,
    ]);
  }

  goBack(): void {
    this.router.navigate(['/learning']);
  }

  // Helpers
  hasMiniature(): boolean {
    const d = this.data();
    return !!d?.course?.miniature_url;
  }

  getMiniatureUrl(): string {
    const d = this.data();
    return (
      d?.course?.miniature_url ||
      '/img/cover/portada-miniature.png'
    );
  }

  private slugify(title: string): string {
    return (title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

