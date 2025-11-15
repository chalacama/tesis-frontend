import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, distinctUntilChanged } from 'rxjs';

import { StartService } from '../../../../../core/api/start/start.service';
import { Course } from '../../../../../core/api/start/start.interfaces';
import { PortfolioBridgeService } from '../../../../../core/api/profile/portfolio-bridge.service';

@Component({
  selector: 'app-user-courses',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './user-courses.component.html',
  styleUrl: './user-courses.component.css',
})
export class UserCoursesComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Imagen de portada por defecto para cursos sin miniatura */
  readonly DEFAULT_COVER = '/img/cover/portada-miniature.png'; // ajusta si es necesario

  /** Grid de cursos */
  courses = signal<Course[]>([]);
  loading = signal<boolean>(true);        // carga inicial
  loadingMore = signal<boolean>(false);   // carga adicional (scroll infinito)
  hasMore = signal<boolean>(true);
  error = signal<string | null>(null);

  /** Filtro actual: created | popular | best_rated */
  currentFilter = signal<'created' | 'popular' | 'best_rated'>('created');

  /** Búsqueda actual (desde PortfolioBridgeService) */
  currentSearch = signal<string>('');

  /** Tipo actual: courses | collaborations */
  type = signal<'courses' | 'collaborations'>('courses');

  /** Username del portafolio */
  username = signal<string>('');

  /** Página actual */
  private page = 1;
  private readonly perPage = 6;

  /** Para el scroll infinito */
  @ViewChild('infiniteAnchor', { static: false })
  infiniteAnchor?: ElementRef<HTMLDivElement>;
  private observer?: IntersectionObserver;

  /** Subcripción al bridge de búsqueda */
  private searchSub?: Subscription;

  /** Skeletons para carga inicial */
  skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  totalLoaded = computed(() => this.courses().length);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private startService: StartService,
    private portfolioBridge: PortfolioBridgeService
  ) {}

  ngOnInit(): void {
    // Tipo: según la ruta hija (courses | collaborations)
    const routePath = this.route.snapshot.routeConfig?.path ?? 'courses';
    this.type.set(routePath.includes('collaborations') ? 'collaborations' : 'courses');

    // Username: viene del padre /portfolio/:username
    const parent = this.route.parent;
    const usernameParam = parent?.snapshot.paramMap.get('username') ?? '';
    this.username.set(usernameParam);

    // Suscribirse a la búsqueda del bridge (lupa del PortfolioComponent)
    this.searchSub = this.portfolioBridge.searchTerm$
      .pipe(distinctUntilChanged())
      .subscribe((term) => {
        this.currentSearch.set(term.trim());
        this.reloadCourses();
      });
  }

  ngAfterViewInit(): void {
    // Inicializamos el observer de scroll infinito
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        const someVisible = entries.some((e) => e.isIntersecting);
        if (someVisible) {
          this.loadMore();
        }
      });

      if (this.infiniteAnchor?.nativeElement) {
        this.observer.observe(this.infiniteAnchor.nativeElement);
      }
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.searchSub?.unsubscribe();
  }

  /** Cambiar filtro (Mas recientes / Popular / Mejores valorados) */
  changeFilter(filter: 'created' | 'popular' | 'best_rated') {
    if (this.currentFilter() === filter) return;
    this.currentFilter.set(filter);
    this.reloadCourses();
  }

  /** Recarga completa (page 1, limpia grid) */
  private reloadCourses() {
    this.page = 1;
    this.hasMore.set(true);
    this.courses.set([]);
    this.fetchCourses(true);
  }

  /** Carga la primera página o siguientes */
  private fetchCourses(isFirstLoad: boolean) {
    if (!this.hasMore() && !isFirstLoad) return;

    const username = this.username();
    if (!username) {
      this.error.set('Usuario no válido para portafolio.');
      this.loading.set(false);
      return;
    }

    if (isFirstLoad) {
      this.loading.set(true);
      this.loadingMore.set(false);
    } else {
      this.loadingMore.set(true);
    }

    const filter = this.currentFilter();
    const q = this.currentSearch();
    const type = this.type();

    const usernameForApi = username; // lo mandamos tal cual (con o sin @)

    const request$ =
      type === 'courses'
        ? this.startService.getPortfolioCourses(
            usernameForApi,
            this.page,
            this.perPage,
            filter,
            q || undefined
          )
        : this.startService.getPortfolioCollaborations(
            usernameForApi,
            this.page,
            this.perPage,
            filter,
            q || undefined
          );

    request$.subscribe({
      next: (res) => {
        const newCourses = res.courses || [];
        if (this.page === 1) {
          this.courses.set(newCourses);
        } else {
          this.courses.update((prev) => [...prev, ...newCourses]);
        }

        this.hasMore.set(res.has_more);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se pudieron cargar los cursos.');
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  /** Scroll infinito: cargar más páginas */
  private loadMore() {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    this.page++;
    this.fetchCourses(false);
  }

  /** Abrir detalle del curso: /learning/course/:slug/:id */
  openCourse(course: Course) {
    const slug = this.slugify(course.title);
    this.router.navigate(['/learning/course', slug, course.id]);
  }

  /** Abrir portafolio del tutor: /learning/portfolio/@username/courses */
  openTutorPortfolio(course: Course) {
    const tutor = course.tutor;
    if (!tutor || !tutor.username) return;

    const rawUsername = tutor.username;
    const usernameWithAt = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;

    this.router.navigate(['/learning/portfolio', usernameWithAt, 'courses']);
  }

  /** Iniciales del tutor cuando no hay foto */
  getTutorInitials(course: Course): string {
    const t = course.tutor;
    if (!t) return '';
    const fullName = (t.name ?? '').trim();
    if (!fullName) return (t.username ?? '').slice(0, 2).toUpperCase();

    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  /** Slugify sencillo para títulos de curso */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9]+/g, '-')     // no alfanumérico -> guión
      .replace(/^-+|-+$/g, '')         // quitar guiones extremos
      || 'curso';
  }
}

