import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Portfolio } from '../../../../core/api/portfolio/portfolio.interface';
import { PortfolioService } from '../../../../core/api/portfolio/portfolio.service';
import { CommonModule } from '@angular/common';

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
  goToCourses(){
    const username = this.route.snapshot.paramMap.get('username');
    this.router.navigate([`/studio/${username}/courses`]);
  }
  
}
