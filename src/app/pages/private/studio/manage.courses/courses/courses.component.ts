import { Component, computed, inject, signal } from '@angular/core';
import {
  Course,
  CourseFilters,
  CourseQueryParams,
  CourseRequest,
  PaginationMeta
} from '../../../../../core/api/course/course.interfaces';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  takeUntil
} from 'rxjs';

import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';

import { Difficulty } from '../../../../../core/api/difficulty/difficulty.interface';
import { DifficultyService } from '../../../../../core/api/difficulty/difficulty.service';
import { CourseService } from '../../../../../core/api/course/course.service';
import { ActivatedRoute, Router } from '@angular/router';

import { PreviewComponent } from '../../../../../shared/UI/components/media/preview/preview.component';
import { ButtonComponent } from '../../../../../shared/UI/components/button/button/button.component';
import { DialogComponent } from '../../../../../shared/UI/components/overlay/dialog/dialog.component';
import { InputLabelComponent } from '../../../../../shared/UI/components/form/input-label/input-label.component';
import { SelectButtonComponent } from '../../../../../shared/UI/components/form/select-button/select-button.component';
import { CheckboxComponent } from '../../../../../shared/UI/components/form/checkbox/checkbox.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

// ⚠️ Ajusta estos paths si en tu proyecto son diferentes
import { Category } from '../../../../../core/api/category/category.interface';
import { CategoryService } from '../../../../../core/api/category/category.service';
import { Career } from '../../../../../core/api/carrer/career.interface';
import { CareerService } from '../../../../../core/api/carrer/career.service';
import { AuthService } from '../../../../../core/api/auth/auth.service';

@Component({
  selector: 'app-courses',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PreviewComponent,
    ButtonComponent,
    DialogComponent,
    InputLabelComponent,
    SelectButtonComponent,
    CheckboxComponent,
    LoadingBarComponent
  ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent {
  formCreate: FormGroup;

  highlightedCourseId = signal<number | null>(null);
  usernameParam?: string;

  saved = signal<boolean>(false);

  difficulties = signal<Difficulty[]>([]);
  categories = signal<Category[]>([]);
  careers = signal<Career[]>([]);

  // Saber si el usuario actual es admin
  isAdmin = signal<boolean>(false);

  // Opciones de privacidad para el modal (se mantiene)
  privacyOptions = [
    { value: true, label: 'Privado' },
    { value: false, label: 'Publico' }
  ];

  private readonly courseService = inject(CourseService);
  private readonly difficultyService = inject(DifficultyService);
  private readonly categoryService = inject(CategoryService);
  private readonly careerService = inject(CareerService);
  private readonly authService = inject(AuthService);

  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Estado principal
  courses = signal<Course[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedCourses = signal<Set<number>>(new Set());

  // Parámetros de consulta
  currentPage = signal<number>(1);
  perPage = signal<number>(10);
  searchTerm = signal<string>('');
  filters = signal<CourseFilters>({});

  // Filtros de UI
  filterDifficultyId = signal<number | null>(null);
  filterCategoryId = signal<number | null>(null);
  filterCareerId = signal<number | null>(null);
  filterCollaborator = signal<string>('');

  // Skeleton rows
  readonly skeletonRowsArray = Array.from({ length: 6 });

  showModalCreate = false;

  readonly perPageOptions = [10, 20, 30, 50];

  hasSelectedCourses = computed(
    () => this.selectedCourses().size > 0
  );

  allCoursesSelected = computed(
    () =>
      this.courses().length > 0 &&
      this.selectedCourses().size === this.courses().length
  );

  hasActiveFilters = computed(() => Object.keys(this.filters()).length > 0);

  constructor(
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute
  ) {
    this.formCreate = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required]],
      difficulty_id: [null, [Validators.required]],
      private: [false]
    });
  }

  ngOnInit(): void {
    // usernameParam sólo existe en /studio/:username (admin)
    this.usernameParam =
      this.route.snapshot.parent?.paramMap.get('username')?.replace(/^@/, '') ??
      undefined;

    this.isAdmin.set(this.authService.hasRole('admin'));

    this.initializeSearchHandler();
    this.loadCourses();
    this.loadDifficulties();
    this.loadCategories();
    this.loadCareers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---- Carga de datos auxiliares ----

  private loadDifficulties(): void {
    this.difficultyService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: difficulties => this.difficulties.set(difficulties),
        error: err => this.error.set(err.message)
      });
  }

  private loadCategories(): void {
    this.categoryService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: categories => this.categories.set(categories),
        error: err => this.error.set(err.message)
      });
  }

  private loadCareers(): void {
    this.careerService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: careers => this.careers.set(careers),
        error: err => this.error.set(err.message)
      });
  }

  // ---- Búsqueda con debounce ----

  private initializeSearchHandler(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchTerm.set(searchTerm);
        this.currentPage.set(1);
        this.loadCourses();
      });
  }

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // ---- Filtros ----

  private syncFiltersFromUI(): void {
    const newFilters: CourseFilters = {};

    if (this.filterDifficultyId() !== null) {
      newFilters.difficulty_id = this.filterDifficultyId()!;
    }
    if (this.filterCategoryId() !== null) {
      newFilters.category_id = this.filterCategoryId()!;
    }
    if (this.filterCareerId() !== null) {
      newFilters.career_id = this.filterCareerId()!;
    }
    if (this.filterCollaborator().trim()) {
      newFilters.collaborator = this.filterCollaborator().trim();
    }

    this.filters.set(newFilters);
  }

  onFilterDifficultyChange(value: number | null): void {
    this.filterDifficultyId.set(value ?? null);
    this.currentPage.set(1);
    this.syncFiltersFromUI();
    this.loadCourses();
  }

  onFilterCategoryChange(value: number | null): void {
    this.filterCategoryId.set(value ?? null);
    this.currentPage.set(1);
    this.syncFiltersFromUI();
    this.loadCourses();
  }

  onFilterCareerChange(value: number | null): void {
    this.filterCareerId.set(value ?? null);
    this.currentPage.set(1);
    this.syncFiltersFromUI();
    this.loadCourses();
  }

  onFilterCollaboratorChange(value: string): void {
    this.filterCollaborator.set(value);
    this.currentPage.set(1);
    this.syncFiltersFromUI();
    this.loadCourses();
  }

  clearFilters(): void {
    this.filterDifficultyId.set(null);
    this.filterCategoryId.set(null);
    this.filterCareerId.set(null);
    this.filterCollaborator.set('');

    this.filters.set({});
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadCourses();
  }

  // ---- Carga de cursos ----

  loadCourses(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: CourseQueryParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchTerm() || undefined,
      filters:
        Object.keys(this.filters()).length > 0 ? this.filters() : undefined
    };

    const routeParams = this.usernameParam
      ? { username: this.usernameParam }
      : undefined;

    this.courseService
      .getCourses(params, routeParams)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.error.set(error.message);
          return of({
            courses: [],
            pagination: {
              total: 0,
              per_page: this.perPage(),
              current_page: 1,
              last_page: 1
            } as PaginationMeta
          });
        })
      )
      .subscribe(response => {
        this.courses.set(response.courses);
        this.pagination.set(response.pagination);
        this.loading.set(false);
        this.selectedCourses.set(new Set());
      });
  }

  // ---- Paginación ----

  onPageChange(page: number): void {
    if (
      page < 1 ||
      (this.pagination() && page > this.pagination()!.last_page)
    ) {
      return;
    }
    this.currentPage.set(page);
    this.loadCourses();
  }

  onPerPageChange(perPage: number): void {
    this.perPage.set(perPage);
    this.currentPage.set(1);
    this.loadCourses();
  }

  // ---- Selección de filas ----

  toggleCourseSelection(courseId: number): void {
    const selected = new Set(this.selectedCourses());
    if (selected.has(courseId)) {
      selected.delete(courseId);
    } else {
      selected.add(courseId);
    }
    this.selectedCourses.set(selected);
  }

  toggleAllCoursesSelection(): void {
    const allSelected = this.allCoursesSelected();
    if (allSelected) {
      this.selectedCourses.set(new Set());
    } else {
      const allIds = new Set(this.courses().map(course => course.id));
      this.selectedCourses.set(allIds);
    }
  }

  isCourseSelected(courseId: number): boolean {
    return this.selectedCourses().has(courseId);
  }

  // ---- Acciones varias ----

  refresh(): void {
    this.loadCourses();
  }

  deleteSelectedCourses(): void {
    const selectedIds = Array.from(this.selectedCourses());
    if (selectedIds.length === 0) return;

    console.log('Eliminar cursos:', selectedIds);
  }

  editCourse(courseId: number): void {
    console.log('Editar curso:', courseId);
  }

  viewCourseAnalytics(courseId: number): void {
    console.log('Ver analíticas del curso:', courseId);
  }

  createCourse(): void {
    this.showModalCreate = true;
  }

  closeModalCreate(): void {
    this.showModalCreate = false;
  }

  onSelectDifficulty(event: any) {
    console.log('Dificultad seleccionada:', event.value);
  }

  submitCourse(): void {
    if (this.formCreate.invalid || this.formCreate.pristine) return;

    const courseData: CourseRequest = this.formCreate.value;

    this.saved.set(true);
    this.courseService
      .createCourse(courseData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: newCourse => {
          console.log('Curso creado:', newCourse);
          this.courses.set([newCourse, ...this.courses()]);
          this.pagination.update(p =>
            p ? { ...p, total: p.total + 1 } : null
          );
          this.highlightedCourseId.set(newCourse.id);
          this.saved.set(false);
          this.formCreate.reset();
          this.closeModalCreate();
          setTimeout(() => this.highlightedCourseId.set(null), 9000);
        },
        error: err => {
          this.error.set(err.message);
          this.saved.set(false);
        }
      });
  }

  goToEditCourse(id: number): void {
    if (!this.usernameParam) {
      this.router.navigate([`/studio/${id}/details`]);
    } else {
      this.router.navigate([`/studio/@${this.usernameParam}/${id}/details`]);
    }
  }

  goToCourse(){
    
  }
}
