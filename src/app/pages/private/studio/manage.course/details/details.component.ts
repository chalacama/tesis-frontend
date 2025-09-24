import { Component, OnInit, DestroyRef, computed, inject, signal, ViewChild } from '@angular/core';
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
import { SelectComponent } from '../../../../../shared/UI/components/form/select/select.component';
import { CategoryService } from '../../../../../core/api/category/category.service';
import { SelectDataviewComponent } from '../../../../../shared/UI/components/form/select-dataview/select-dataview.component';
// + imports
import { CareerService } from '../../../../../core/api/carrer/career.service';
import { Career } from '../../../../../core/api/carrer/career.interface';
import { min } from 'rxjs';


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
    SelectComponent,
    SelectDataviewComponent
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
  private readonly categoryService = inject(CategoryService);
  private readonly careerService = inject(CareerService);
  private readonly host = inject(ElementRef<HTMLElement>);

  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLElement>;
  constructor(


  ) {

  }

  // Estado de UI
  loadingCategories = signal<boolean>(true);
  loadingCourse = signal<boolean>(true);
  loadingDifficulties = signal<boolean>(true);
  loadingCareers = signal<boolean>(true);
  careersAvail = signal<{ id: number; name: string; url_logo: string }[]>([]); // lo que pintaremos en el dataview
  saving = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  isDialogOpen = true; // o false según el caso
  selectedMiniature: File | null = null;

  readonly MAX_CATEGORIES = 4;
readonly MAX_CAREERS = 2;

  // Datos
  course = signal<CourseDetail | null>(null);
  difficulties = signal<Difficulty[]>([]);
  categoriesAvail = signal<{ id: number; name: string }[]>([])
  // Para reset/diff
  private originalCourse: CourseDetail | null = null;

  // Form reactivo tipado (sin nullables)
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    difficulty_id: [2, [Validators.required]],
    private: [false, [Validators.required]],
    enabled: [true, [Validators.required]],
    code: [''], // nullable en backend; aquí lo tratamos como string ('' -> null al guardar si quieres)
    careers: this.fb.control<number[]>([], { nonNullable: true }),    // ids
    categories: this.fb.control<number[]>([], { nonNullable: true }),    // ids
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
    this.loadCategories();
    this.loadCareers(); // + cargar carreras
  }
  private loadCareers(): void {
    this.loadingCareers.set(true);
    this.careerService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items: Career[]) => {
          // mapeo a la forma que usa el select-dataview (label/value/src)
          this.careersAvail.set(
            items.map(c => ({ id: c.id, name: c.name, url_logo: c.url_logo }))
          );
          this.loadingCareers.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message || 'No se pudieron cargar las carreras.');
          this.careersAvail.set([]);
          this.loadingCareers.set(false);
        }
      });
  }
  onMiniatureChange(file: File | null) {
  this.selectedMiniature = file;
  if (file) {
    // solo previsualización (opcional)
    const reader = new FileReader();
    reader.onload = () => this.form.patchValue({ miniatureUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }
}
  private loadCategories(): void {
    this.loadingCategories.set(true);
    this.categoryService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          // Mapea a {id, name} que usa el ui-select (optionLabel/optionValue)
          this.categoriesAvail.set(items.map(c => ({ id: c.id, name: c.name })));
          this.loadingCategories.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message || 'No se pudieron cargar las categorías.');
          this.categoriesAvail.set([]);
          this.loadingCategories.set(false);
        }
      });
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

  

  // ----- Acciones -----
  save(): void {
    const c = this.course();
    if (!c) return;

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    // Respeta límites también en front
  let careers = this.form.value.careers ?? [];
  let categories = this.form.value.categories ?? [];
  careers = Array.isArray(careers) ? [...new Set(careers)].slice(0, this.MAX_CAREERS) : [];
  categories = Array.isArray(categories) ? [...new Set(categories)].slice(0, this.MAX_CATEGORIES) : [];

  // Construye el payload
  const payload = {
    title: this.form.value.title ?? undefined,
    description: this.form.value.description ?? undefined,
    difficulty_id: this.form.value.difficulty_id ?? undefined,
    private: this.form.value.private ?? undefined,
    enabled: this.form.value.enabled ?? undefined,
    code: this.form.value.code ?? undefined,
    careers,
    categories, // si quieres enviar con order, arma [{id, order}]
    miniature: this.selectedMiniature ?? undefined, // si hay archivo, lo envía
  };

  this.saving.set(true);
  this.errorMsg.set(null);
  this.successMsg.set(null);

  this.courseService
    .updateCourse(c.id, payload) // << envía archivo si hay
    .pipe()
    .subscribe({
      next: (res) => {
        // Actualiza estado local
        this.course.set(res.course);
        this.originalCourse = res.course;
        this.patchFromCourse(res.course);

        this.form.markAsPristine();
        this.successMsg.set('Curso actualizado correctamente.');
        this.saving.set(false);
        // opcional: cierra modal de miniatura
        this.modalOpenMiniature = false;
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message || 'No se pudo actualizar el curso.');
        this.saving.set(false);
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
        return { id: d.id, name: d.name, color: 'var(--danger-500)' };
      }
      // por defecto usa el color activo de tu DS
      return { id: d.id, name: d.name, color: 'var(--active-color)' };
    });
  }
  onSelectDifficulty(val: any) {
    // console.log('difficulty_id =>', val); 
  }
  popoverOpen = false;
  popover() {
    this.popoverOpen = !this.popoverOpen;

  }

  codeGeneration() {

    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.courseService.generateCode()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newcode: string) => {

          this.form.patchValue({
            code: newcode
          });
          console.log(newcode);
          this.form.markAsDirty();

          this.successMsg.set('Código generado correctamente.');
          setTimeout(() => this.successMsg.set(null), 2000);
        },
        error: (err: Error) => {
          this.errorMsg.set(err.message || 'No se pudo generar el código.');
        }
      });
  }
  codeActivation() {
    
    this.form.patchValue({
      private: true
    });
    this.form.markAsDirty(); // <-- Añade esta línea
    

  }
  
  codeDesactivation() {
  
  
    this.form.patchValue({
      private: false,
    });
    this.form.markAsDirty();
    
  }
  copyToClipboard() {
    const code = this.form.get('code')?.value;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        this.successMsg.set('Código copiado al portapapeles.');
        setTimeout(() => this.successMsg.set(null), 2000);
      }).catch(err => {
        this.errorMsg.set('No se pudo copiar el código.');
      });
  }
}
}

