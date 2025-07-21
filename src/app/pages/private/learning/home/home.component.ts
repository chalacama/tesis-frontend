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
  courses: Course[] = [];

  constructor(private startService: StartService) {}

  ngOnInit(): void {
    this.startService.getRecommendedCourses().subscribe({
      next: (courses) => this.courses = courses,
      error: (err) => console.error('Error al cargar cursos recomendados', err)
    });
  }
}
