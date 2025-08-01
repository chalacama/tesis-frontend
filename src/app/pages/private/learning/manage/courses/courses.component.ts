import { Component, computed, inject, signal } from '@angular/core';
import { Course, CourseFilters, CourseQueryParams, Pagination } from '../../../../../core/api/manage/course/course.interfaces';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap, takeUntil } from 'rxjs';
import { CourseService } from '../../../../../core/api/manage/course/course.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-courses',
  imports: [CommonModule,FormsModule ,ReactiveFormsModule ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent {

  private readonly courseService = inject(CourseService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Signals para manejo de estado reactivo
  courses = signal<Course[]>([]);
  pagination = signal<Pagination | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedCourses = signal<Set<number>>(new Set());
  
  // Parámetros de consulta
  currentPage = signal<number>(1);
  perPage = signal<number>(10);
  searchTerm = signal<string>('');
  filters = signal<CourseFilters>({});

  showModalCreate = false;

  // Opciones para el selector de filas por página
  readonly perPageOptions = [10, 20, 30, 50];

  // Computed para verificar si hay cursos seleccionados
  hasSelectedCourses = computed(() => this.selectedCourses().size > 0);
  allCoursesSelected = computed(() => 
    this.courses().length > 0 && this.selectedCourses().size === this.courses().length
  );

  ngOnInit(): void {
    this.initializeSearchHandler();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el manejador de búsqueda con debounce
   */
  private initializeSearchHandler(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(searchTerm => {
          this.searchTerm.set(searchTerm);
          this.currentPage.set(1); // Reset página al buscar
          return this.performSearch();
        })
      )
      .subscribe();
  }

  /**
   * Carga los cursos con los parámetros actuales
   */
  loadCourses(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: CourseQueryParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchTerm() || undefined,
      filters: Object.keys(this.filters()).length > 0 ? this.filters() : undefined
    };

    this.courseService.getCourses(params)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.error.set(error.message);
          return of({ courses: [], pagination: { total: 0, per_page: 10, current_page: 1, last_page: 1 } });
        })
      )
      .subscribe(response => {
        this.courses.set(response.courses);
        this.pagination.set(response.pagination);
        this.loading.set(false);
        this.selectedCourses.set(new Set()); // Limpiar selección al cargar nuevos datos
      });
  }

  /**
   * Realiza la búsqueda con los parámetros actuales
   */
  private performSearch() {
    const params: CourseQueryParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchTerm() || undefined,
      filters: Object.keys(this.filters()).length > 0 ? this.filters() : undefined
    };

    return this.courseService.getCourses(params)
      .pipe(
        catchError(error => {
          this.error.set(error.message);
          return of({ courses: [], pagination: { total: 0, per_page: 10, current_page: 1, last_page: 1 } });
        })
      );
  }

  /**
   * Maneja la búsqueda desde el input
   */
  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Cambia la página actual
   */
  onPageChange(page: number): void {
    if (page < 1 || (this.pagination() && page > this.pagination()!.last_page)) {
      return;
    }
    this.currentPage.set(page);
    this.loadCourses();
  }

  /**
   * Cambia el número de elementos por página
   */
  onPerPageChange(perPage: number): void {
    this.perPage.set(perPage);
    this.currentPage.set(1);
    this.loadCourses();
  }

  /**
   * Aplica filtros
   */
  applyFilters(filters: CourseFilters): void {
    this.filters.set(filters);
    this.currentPage.set(1);
    this.loadCourses();
  }

  /**
   * Limpia los filtros
   */
  clearFilters(): void {
    this.filters.set({});
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadCourses();
  }

  /**
   * Alterna la selección de un curso
   */
  toggleCourseSelection(courseId: number): void {
    const selected = new Set(this.selectedCourses());
    if (selected.has(courseId)) {
      selected.delete(courseId);
    } else {
      selected.add(courseId);
    }
    this.selectedCourses.set(selected);
  }

  /**
   * Alterna la selección de todos los cursos
   */
  toggleAllCoursesSelection(): void {
    const allSelected = this.allCoursesSelected();
    if (allSelected) {
      this.selectedCourses.set(new Set());
    } else {
      const allIds = new Set(this.courses().map(course => course.id));
      this.selectedCourses.set(allIds);
    }
  }

  /**
   * Verifica si un curso está seleccionado
   */
  isCourseSelected(courseId: number): boolean {
    return this.selectedCourses().has(courseId);
  }

  /**
   * Refresca los datos limpiando el cache
   */
  refresh(): void {
    this.courseService.clearCache();
    this.loadCourses();
  }

  /**
   * Acciones para cursos seleccionados
   */
  deleteSelectedCourses(): void {
    const selectedIds = Array.from(this.selectedCourses());
    if (selectedIds.length === 0) return;

    // Aquí implementarías la lógica de eliminación
    console.log('Eliminar cursos:', selectedIds);
    // Después de eliminar, recargar la lista
    // this.loadCourses();
  }

  /**
   * Navega a la edición de un curso
   */
  editCourse(courseId: number): void {
    // Implementar navegación a edición
    console.log('Editar curso:', courseId);
  }

  /**
   * Navega a las analíticas de un curso
   */
  viewCourseAnalytics(courseId: number): void {
    // Implementar navegación a analíticas
    console.log('Ver analíticas del curso:', courseId);
  }

  /**
   * Crea un nuevo curso
   */
  createCourse(): void {
    this.showModalCreate = true;
    // Implementar navegación a creación
    console.log('Crear nuevo curso');
  }
  closeModalCreate() {
    this.showModalCreate = false;
  }
}

