import { Component, OnInit, DestroyRef, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CourseService } from '../../../../../core/api/course/course.service';
import { DifficultyService } from '../../../../../core/api/difficulty/difficulty.service';

import { CourseDetail, CourseDetailResponse } from '../../../../../core/api/course/course.details.interfaces';
import { Difficulty } from '../../../../../core/api/difficulty/difficulty.interface';
import { CourseRequest } from '../../../../../core/api/course/course.interfaces';
import { Directive, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { AutosizeDirective } from '../../../../../shared/UI/directive/autosize.directive';
import {  SelectButtonComponent } from '../../../../../shared/UI/components/form/select-button/select-button.component';
import { ButtonComponent } from '../../../../../shared/UI/components/button/button/button.component';
import { CheckboxComponent } from '../../../../../shared/UI/components/form/checkbox/checkbox.component';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,AutosizeDirective,SelectButtonComponent, ButtonComponent],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})


export class DetailsComponent implements OnInit {

  // Inyección
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);
  private readonly difficultyService = inject(DifficultyService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly host = inject(ElementRef<HTMLElement>);

  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLElement>;
  constructor(
    

  ) {

    }
  
  // Estado de UI
  loadingCourse = signal<boolean>(true);
  loadingDifficulties = signal<boolean>(true);
  saving = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  // Datos
  course = signal<CourseDetail | null>(null);
  difficulties = signal<Difficulty[]>([]);

  // Para reset/diff
  private originalCourse: CourseDetail | null = null;

  // Form reactivo tipado (sin nullables)
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    difficulty_id: [2, [Validators.required]],
    private: [false, [Validators.required]],
    enabled: [true, [Validators.required]]
  });

  // Computados útiles
  canSave = computed(() => this.form.valid && this.form.dirty && !this.saving());
  showSkeleton = computed(() => this.loadingCourse() || this.loadingDifficulties());

  ngOnInit(): void {
    const courseParam = this.getCourseParamFromRoute();
    if (!courseParam) {
      this.errorMsg.set('No se encontró el parámetro de curso en la ruta.');
      this.loadingCourse.set(false);
      return;
    }

    this.loadDifficulties();
    this.loadCourse(courseParam);
  }
  

  // ----- Carga de datos -----
  private loadDifficulties(): void {
    this.loadingDifficulties.set(true);
    this.difficultyService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.difficulties.set(items);
          // Si no hay valor válido aún, precarga con el primero
          if (!this.form.controls.difficulty_id.value && items.length) {
            this.form.controls.difficulty_id.setValue(items[0].id);
          }
          this.loadingDifficulties.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message || 'No se pudieron cargar las dificultades.');
          this.loadingDifficulties.set(false);
        }
      });
  }

  private loadCourse(courseParam: string | number): void {
    this.errorMsg.set(null);
    this.loadingCourse.set(true);

    this.courseService.getCourseDetail(courseParam)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: CourseDetailResponse) => {
          const c = res.course;
          this.course.set(c);
          this.originalCourse = c;
          this.patchFormFromCourse(c);
          this.loadingCourse.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message || 'No se pudo cargar el curso.');
          this.loadingCourse.set(false);
        }
      });
  }

  // ----- Helpers -----
  private patchFormFromCourse(c: CourseDetail): void {
    this.form.reset(
      {
        title: c.title,
        description: c.description,
        difficulty_id: c.difficulty_id,
        private: c.private,
        enabled: c.enabled
      },
      { emitEvent: false }
    );
  }

  private getCourseParamFromRoute(): string | null {
    // Busca 'id' en la ruta actual y en el padre (robusto para layouts anidados)
    return this.route.snapshot.paramMap.get('id')
      ?? this.route.parent?.snapshot.paramMap.get('id')
      ?? null;
  }

  trackByDifficulty = (_: number, item: Difficulty) => item.id;

  // Construye un payload reducido solo con campos modificados
  private buildDiffPayload(): Partial<CourseRequest> & {
    private?: boolean;
    enabled?: boolean;
    difficulty_id?: number;
  } {
    const current = this.form.getRawValue();
    const orig = this.originalCourse!;
    const payload: any = {};

    if (current.title !== orig.title) payload.title = current.title;
    if (current.description !== orig.description) payload.description = current.description;
    if (current.difficulty_id !== orig.difficulty_id) payload.difficulty_id = current.difficulty_id;
    if (current.private !== orig.private) payload.private = current.private;
    if (current.enabled !== orig.enabled) payload.enabled = current.enabled;

    return payload;
  }

  // ----- Acciones -----
  save(): void {
    const c = this.course();
    if (!c) return;

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildDiffPayload();
    if (Object.keys(payload).length === 0) {
      this.successMsg.set('No hay cambios por guardar.');
      setTimeout(() => this.successMsg.set(null), 1800);
      return;
    }

    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.saving.set(true);

    this.courseService.updateCourse(c.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const updated = res.course;
          this.course.set(updated);
          this.originalCourse = updated;
          this.patchFormFromCourse(updated);
          this.saving.set(false);
          this.successMsg.set('Cambios guardados correctamente.');
          setTimeout(() => this.successMsg.set(null), 2500);
        },
        error: (err: Error) => {
          this.saving.set(false);
          this.errorMsg.set(err.message || 'Error al guardar los cambios.');
        }
      });
  }

  resetForm(): void {
    if (!this.originalCourse) return;
    this.patchFormFromCourse(this.originalCourse);
  }

  retryLoad(): void {
    const param = this.getCourseParamFromRoute();
    if (param) {
      this.loadCourse(param);
    }
  }
  // Dentro de DetailsComponent
get f() {
  return this.form.controls;
}
modalOpenMiniature = false;
openModalMiniature() {
  this.modalOpenMiniature = !this.modalOpenMiniature;

}
// in your component's TypeScript code
mapDifficulties() {
  // usa tus vars o hex
  return this.difficulties().map(d => {
    if (d.id === 1) {
      return { value: d.id, label: d.name, color: 'var(--help-500)', bg: 'color-mix(in oklab, var(--help-500) 10%, transparent)' };
    }
    if (d.id === 2) {
      return { value: d.id, label: d.name, color: 'var(--warn-500)', bg: 'color-mix(in oklab, var(--warn-500) 10%, transparent)' };
    }
    if (d.id === 3) {
      return { value: d.id, label: d.name, color: 'var(--danger-500)', bg: 'color-mix(in oklab, var(--danger-500) 10%, transparent)' };
    }
    // por defecto usa el color activo de tu DS
    return { value: d.id, label: d.name, color: 'var(--active-color)' };
  });
}



}

