import { Component, OnInit } from '@angular/core';
import { Course } from '../../../../core/api/start/start.interfaces';
import { StartService } from '../../../../core/api/start/start.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  recommendedCourses: Course[] = [];
  bestRatedCourses: Course[] = [];
  popularCourses: Course[] = [];

  constructor(private startService: StartService) {}

  ngOnInit(): void {
    
    this.startService.getRecommendedCourses().subscribe({
      next: (courses) => this.recommendedCourses = courses,
      error: (err) => console.error('Error al cargar cursos recomendados', err)
    });
    this.startService.getTopBestRatedCourses().subscribe({
      next: (courses) => this.bestRatedCourses = courses,
      error: (err) => console.error('Error al cargar cursos recomendados', err)
    });
    this.startService.getTopPopularCourses().subscribe({
      next: (courses) => this.popularCourses = courses,
      error: (err) => console.error('Error al cargar cursos recomendados', err)
    });
  }
}
