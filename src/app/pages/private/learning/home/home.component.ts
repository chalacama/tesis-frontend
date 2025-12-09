import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Course } from '../../../../core/api/start/start.interfaces';
import { StartService } from '../../../../core/api/start/start.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../../../shared/UI/components/media/avatar/avatar.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, AvatarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  courses: Course[] = [];
  filter: string = 'all';
  page: number = 1;
  perPage: number = 9;
  hasMore: boolean = true;
  loading: boolean = false;

  // Skeletons
  skeletonItems: number[] = [];
  moreSkeletonItems: number[] = [];

  // Preview tipo GIF (video)
  previewCourseId: number | null = null;

  constructor(private startService: StartService, private router: Router) {}

  ngOnInit(): void {
    // Skeletons (mismo número que perPage)
    this.skeletonItems = Array.from({ length: this.perPage }, (_, i) => i);
    // Skeletons pequeños para "cargar más"
    this.moreSkeletonItems = Array.from({ length: 3 }, (_, i) => i);

    this.loadCourses();
  }
    getInitialsFromUser(u: any): string {
      if (!u) return 'U';
      const base = this.getFullName(u) || u.username || 'D M';
      return base
        .split(/\s+/)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase() || '')
        .join('') || 'D M';
    }
    getFullName(u: any): string {
        if (!u) return '';
        const n = (u.name || '').trim();
        const ln = (u.lastname || '').trim();
        const full = [n, ln].filter(Boolean).join(' ');
        return full || (u.username || '');
      }
  loadCourses(): void {
    if (this.loading || !this.hasMore) return;

    this.loading = true;

    this.startService.getCoursesByFilter({
      filter: this.filter,
      page: this.page,
      per_page: this.perPage
    }).subscribe({
      next: (res) => {
        this.courses.push(...res.courses);
        this.page++;
        this.hasMore = res.has_more;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar cursos:', err);
        this.loading = false;
      }
    });
  }

  changeFilter(newFilter: string): void {
    if (this.filter === newFilter) return;
    this.filter = newFilter;
    this.page = 1;
    this.hasMore = true;
    this.courses = [];
    this.loadCourses();
  }

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  onContainerScroll(): void {
    const container = this.scrollContainer.nativeElement;
    const scrollThreshold = 100;

    const scrollPos = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;

    if (scrollHeight - scrollPos < scrollThreshold) {
      this.loadCourses();
    }
  }

  viewPortfolio(username?: string | null) {
    if (!username) return;
    this.router.navigate(['/learning/portfolio/@' + username]);
  }

  titleCoursePath(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  viewCourse(course: any) {
    this.router.navigate(['/learning/course/' + this.titleCoursePath(course.title) + '/' + course.id]);
  }

  /* ==== Preview tipo GIF (video intro) ==== */

  onThumbnailEnter(course: Course): void {
    if (course.first_learning_content_url) {
      this.previewCourseId = course.id;
    }
  }

  onThumbnailLeave(course: Course): void {
    if (this.previewCourseId === course.id) {
      this.previewCourseId = null;
    }
  }

  isPreviewActive(course: Course): boolean {
    return !!course.first_learning_content_url && this.previewCourseId === course.id;
  }

  /* helper para registros (por si viene undefined) */
  getRegistrations(course: Course): number {
    // asegúrate de tener `registrations_count` en la interfaz Course
    return (course as any).registrations_count ?? 0;
  }
}
