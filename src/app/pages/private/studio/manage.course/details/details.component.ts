import { Component, OnInit, DestroyRef, computed, inject, signal, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CourseService } from '../../../../../core/api/course/course.service';
import { DifficultyService } from '../../../../../core/api/difficulty/difficulty.service';

import { CourseDetail, CourseDetailResponse } from '../../../../../core/api/course/course.details.interfaces';
import { Difficulty } from '../../../../../core/api/difficulty/difficulty.interface';
import { CourseRequest } from '../../../../../core/api/course/course.interfaces';
import { ElementRef } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/UI/components/button/button/button.component';
import { InputLabelComponent } from '../../../../../shared/UI/components/form/input-label/input-label.component';

import { FileUploadComponent } from '../../../../../shared/UI/components/form/file-upload/file-upload.component';
import { SelectButtonComponent } from '../../../../../shared/UI/components/form/select-button/select-button.component';
import { ToggleWitchComponent } from '../../../../../shared/UI/components/form/toggle-witch/toggle-witch.component';
import { PopoverComponent } from '../../../../../shared/UI/components/overlay/popover/popover.component';


@Component({
  selector: 'app-details',
  /* standalone: true, */
  imports: [CommonModule, ReactiveFormsModule,
    SelectButtonComponent,
    ButtonComponent,
    InputLabelComponent,
    FileUploadComponent,
    PopoverComponent,
    ToggleWitchComponent,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})


export class DetailsComponent implements OnInit {

 povOpen = false;
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

  isDialogOpen = true; // o false según el caso

  
  // Datos
  course = signal<CourseDetail | null>(null);
  difficulties = signal<Difficulty[]>([]);

  // Para reset/diff
  private originalCourse: CourseDetail | null = null;

  // Form reactivo tipado (sin nullables)
    form = this.fb.group({
    title:        ['', [Validators.required, Validators.minLength(3)]],
    description:  ['', [Validators.required, Validators.minLength(10)]],
    difficulty_id:[2,  [Validators.required]],
    private:      [false, [Validators.required]],
    enabled:      [true,  [Validators.required]],
    code:         [''], // nullable en backend; aquí lo tratamos como string ('' -> null al guardar si quieres)
    careers:      this.fb.control<number[]>([], { nonNullable: true }),    // ids
    categories:   this.fb.control<number[]>([], { nonNullable: true }),    // ids
    // Solo UI (no se envía): previsualización de la miniatura actual o del archivo cargado
    miniatureUrl: [''],
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
          console.log(c);
          this.originalCourse = c;
          this.patchFromCourse(c);
          this.loadingCourse.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message || 'No se pudo cargar el curso.');
          this.loadingCourse.set(false);
        }
      });
  }

  // ----- Helpers -----
  private patchFromCourse(c: CourseDetail): void {
    this.form.reset(
      {
        title: c.title,
        description: c.description,
        difficulty_id: c.difficulty.id,
        private: c.private,
        enabled: c.enabled,
        code: c.code || '',
        careers: c.careers.map(c => c.id),
        categories: c.categories.map(c => c.id),
        miniatureUrl: c.miniature.url

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
    if (current.difficulty_id !== orig.difficulty.id) payload.difficulty_id = current.difficulty_id;
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
          this.patchFromCourse(updated);
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
    this.patchFromCourse(this.originalCourse);
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
        return { id: d.id, name: d.name, color: 'var(--help-500)' };
      }
      if (d.id === 2) {
        return { id: d.id, name: d.name, color: 'var(--warn-500)' };
      }
      if (d.id === 3) {
        return { id: d.id, name: d.name, color: 'var(--danger-500)'};
      }
      // por defecto usa el color activo de tu DS
      return { id: d.id, name: d.name, color: 'var(--active-color)' };
    });
  }
  onSelectDifficulty(val: any) {
  console.log('difficulty_id =>', val); // debería ser 1 | 2 | 3...
}
popoverOpen = false;
popover() {
  this.popoverOpen = !this.popoverOpen; 

}
}

