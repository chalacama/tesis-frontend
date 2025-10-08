import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PortfolioService } from '../../../../core/api/profile/portfolio.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/api/auth/auth.service';
import { Portfolio } from '../../../../core/api/profile/portfolio.interface';

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent implements OnInit {
  portfolio = signal<Portfolio | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
 constructor( private router: Router,
  private portfolioService: PortfolioService,
    private route: ActivatedRoute,
    private authService: AuthService
 ){

 }

ngOnInit(): void {
  const username = this.route.snapshot.paramMap.get('username');
  if (!username) {
    this.error.set('Nombre de usuario inválido.');
    return;
  }

  this.portfolioService.getPortfolioByUsername(username).subscribe({
    next: (res) => {
      this.portfolio.set(res.portfolio);
      this.loading.set(false);
    },
    error: (err) => {
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

canManage(): boolean {
  const user = this.authService.getCurrentUser();
  const viewed = this.portfolio();

  if (!user || !viewed) return false;

  const isOwner = user.username === viewed.username;
  const isAdmin = user.roles?.some(r => r.name === 'admin');
  return isOwner || isAdmin;
}

  
}
