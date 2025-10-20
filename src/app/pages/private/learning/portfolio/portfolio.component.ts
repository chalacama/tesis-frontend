import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { PortfolioService } from '../../../../core/api/profile/portfolio.service';
import { AuthService } from '../../../../core/api/auth/auth.service';
import { Portfolio } from '../../../../core/api/profile/portfolio.interface';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, DatePipe, NgOptimizedImage],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
  host: { class: 'portfolio-page' }
})
export class PortfolioComponent implements OnInit {
  portfolio = signal<Portfolio | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Derivados útiles
  isOwner = computed(() => {
    const user = this.authService.getCurrentUser();
    const viewed = this.portfolio();
    return !!user && !!viewed && user.username === viewed.username;
  });

  isAdmin = computed(() => {
    const user = this.authService.getCurrentUser();
    return !!user && !!user.roles?.some(r => r.name === 'admin');
  });

  canManage = computed(() => this.isOwner() || this.isAdmin());

  // UI helpers
  verifiedByRole = computed(() => {
    const p = this.portfolio();
    // Marca "verificado" para admin o tutor (ajústalo a tu lógica)
    return !!p && ['admin', 'tutor'].includes(p.role?.toLowerCase?.() ?? '');
  });

  avatarUrl = computed(() => this.portfolio()?.profile_picture_url || '');
  initials = computed(() => {
    const p = this.portfolio();
    if (!p) return '';
    const n = `${p.name ?? ''} ${p.lastname ?? ''}`.trim();
    return n.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('');
  });

  constructor(
    private router: Router,
    private portfolioService: PortfolioService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) {
      this.error.set('Nombre de usuario inválido.');
      this.loading.set(false);
      return;
    }

    this.portfolioService.getPortfolioByUsername(username).subscribe({
      next: (res) => {
        this.portfolio.set(res.portfolio);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el portafolio.');
        this.loading.set(false);
      },
    });
  }

  goToCourses() {
    const currentUser = this.authService.getCurrentUser();
    const viewedUser = this.portfolio();
    if (!currentUser || !viewedUser) return;

    const isOwner = currentUser.username === viewedUser.username;
    const isAdmin = currentUser.roles?.some(r => r.name === 'admin');

    if (isOwner) {
      this.router.navigate(['/studio/courses']);
    } else if (isAdmin) {
      this.router.navigate([`/studio/@${viewedUser.username}/courses`]);
    } else {
      alert('No tienes permisos para gestionar estos cursos.');
    }
  }

  // Acciones de cabecera simuladas (placeholder)
  onFollow() { /* TODO: integrar 'seguir' o 'suscribirse' si aplica */ }
  onJoin() { /* TODO: integrar una acción premium/miembro si aplica */ }
}
