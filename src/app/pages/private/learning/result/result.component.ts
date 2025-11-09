import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StartService } from '../../../../core/api/start/start.service';
import { Course } from '../../../../core/api/start/start.interfaces';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private start = inject(StartService);

  q = '';
  filter = 'all';
  courses: Course[] = [];

  page = 1;
  perPage = 8;
  hasMore = true;
  loading = false;

  // cuántos skeletons mostrar mientras carga
  skeletonCount = 6;
  skeletons = Array.from({ length: this.skeletonCount });

  constructor() {
    // Escucha cambios en ?q=... y reinicia la búsqueda
    this.route.queryParamMap.pipe(
      map(params => (params.get('q') ?? '').trim()),
      distinctUntilChanged(),
      debounceTime(50)
    ).subscribe(q => {
      this.q = q;
      this.resetAndLoad();
    });
  }

  private resetAndLoad() {
    this.courses = [];
    this.page = 1;
    this.hasMore = true;
    this.loadMore();
  }

  loadMore() {
    if (this.loading || !this.hasMore) return;
    this.loading = true;

    this.start.getCoursesByFilter({
      filter: this.filter,
      page: this.page,
      per_page: this.perPage,
      q: this.q || undefined
    }).subscribe({
      next: (res) => {
        this.courses.push(...res.courses);
        this.page++;
        this.hasMore = res.has_more;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar resultados:', err);
        this.loading = false;
      }
    });
  }

  // Scroll infinito basado en ventana
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const threshold = 280; // px desde el fondo
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    if (pageHeight - scrollPosition < threshold) {
      this.loadMore();
    }
  }

  viewPortfolio(username?: string | null) {
    if (!username) return;
    this.router.navigate(['/learning/portfolio/@' + username]);
  }

  titleCoursePath(title: string) {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  viewCourse(course: Course) {
    this.router.navigate([
      '/learning/course',
      this.titleCoursePath(course.title),
      course.id
    ]);
  }
}

