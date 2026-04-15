import { Component, OnInit, DestroyRef, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, Validators, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { CourseService } from '../../../../../core/api/course/course.service';
import { DifficultyService } from '../../../../../core/api/difficulty/difficulty.service';

import { CourseDetail, CourseDetailResponse } from '../../../../../core/api/course/course.details.interfaces';
import { Difficulty } from '../../../../../core/api/difficulty/difficulty.interface';
import { CourseRequest } from '../../../../../core/api/course/course.interfaces';
import { ElementRef } from '@angular/core';
import { InputLabelComponent } from '../../../../../shared/UI/components/form/input-label/input-label.component';

import { SelectButtonComponent } from '../../../../../shared/UI/components/form/select-button/select-button.component';
import { ToggleWitchComponent } from '../../../../../shared/UI/components/form/toggle-witch/toggle-witch.component';
import { PopoverComponent } from '../../../../../shared/UI/components/overlay/popover/popover.component';
import { SelectComponent } from '../../../../../shared/UI/components/form/select/select.component';
import { CategoryService } from '../../../../../core/api/category/category.service';
import { SelectDataviewComponent } from '../../../../../shared/UI/components/form/select-dataview/select-dataview.component';
// + imports
import { CareerService } from '../../../../../core/api/carrer/career.service';
import { Career } from '../../../../../core/api/carrer/career.interface';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { StudioBridgeService } from '../../../../../core/api/studio/studio-bridge.service';
import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { TypeService } from '../../../../../core/api/type/type.service';
import { TypeThumbnailResponse } from '../../../../../core/api/type/type.interface';
import { DialogComponent } from '../../../../../shared/UI/components/overlay/dialog/dialog.component';


@Component({
  selector: 'app-details',
  /* standalone: true, */
  imports: [CommonModule, ReactiveFormsModule, FormsModule,
    SelectButtonComponent,
    IconComponent,
    InputLabelComponent,
    PopoverComponent,
    ToggleWitchComponent,
    SelectComponent,
    SelectDataviewComponent,
    LoadingBarComponent,
    DialogComponent
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
  private readonly studioBridge = inject(StudioBridgeService);
  private readonly typeService = inject(TypeService);
  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLElement>;
  
  constructor(


  ) {
    
  }

  // Estado de UI
  loadingCategories = signal<boolean>(true);
  loadingCourse = signal<boolean>(true);
  loadingDifficulties = signal<boolean>(true);
  loadingCareers = signal<boolean>(true);
  loadingTypes = signal<boolean>(true);
  careersAvail = signal<{ id: number; name: string; url_logo: string }[]>([]); // lo que pintaremos en el dataview
  saving = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  saved = signal<boolean>(false);
  sabed  = signal<boolean>(true);;

  isDialogOpen = true; // o false según el caso
  selectedMiniature: File | null = null;
  miniatureAction: 'none' | 'upload' | 'remove' = 'none';

  // Nuevos signals para miniatura
  typeThumbnails = signal<TypeThumbnailResponse[]>([]);
  selectedTypeThumbnailId = signal<number | null>(null);
  previewImageUrl = signal<string | null>(null);
  fileToUpload = signal<File | null>(null);
  externalUrl = signal<string>('');
  isMarkedForRemoval = signal<boolean>(false);
  previewDialogVisible = signal(false);


  readonly MAX_CATEGORIES = 4;
readonly MAX_CAREERS = 2;
  

  // Datos
  course = signal<CourseDetail | null>(null);
  difficulties = signal<Difficulty[]>([]);
  categoriesAvail = signal<{ id: number; name: string }[]>([])
  // Para reset/diff
   originalCourse: CourseDetail | null = null;
  
  // Form reactivo tipado (sin nullables)
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    difficulty_id: [2, [Validators.required]],
    private: [false],
    enabled: [true],
    code: [''], // nullable en backend; aquí lo tratamos como string ('' -> null al guardar si quieres)
    careers: this.fb.control<number[]>([], { nonNullable: true }),    // ids
    categories: this.fb.control<number[]>([], { nonNullable: true }),    // ids
    miniatureUrl: [''], // Permite '' o null sin validación
  });
   
  // Signals reactivos para detectar cambios del formulario
  private formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value, manualCleanup: true });

  // Computados útiles
  canSave = computed(() => this.form.valid && this.form.dirty && !this.saving());

  mappedTypeThumbnails = computed(() => this.typeThumbnails().map(type => ({
    ...type,
    icon: type.id === 1 ? 'svg/link-image.svg' : type.id === 2 ? 'svg/archive-image.svg' : undefined
  })));

  // Obtener metadatos del tipo de miniatura seleccionado
  selectedThumbnailMetadata = computed(() => {
    const selectedId = this.selectedTypeThumbnailId();
    if (!selectedId) return null;
    
    const selected = this.typeThumbnails().find(t => t.id === selectedId);
    if (!selected) return null;
    
    const parts: string[] = [];
    
    // Dimensiones
    if (selected.width && selected.height) {
      parts.push(`${selected.width}x${selected.height}`);
    }
    
    // Aspect ratio
    if (selected.aspect_ratio) {
      parts.push(selected.aspect_ratio);
    }
    
    // Tamaño máximo
    if (selected.max_size_bytes) {
      const maxSize = this.formatFileSize(selected.max_size_bytes);
      parts.push(`Máx: ${maxSize}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : null;
  });



  isSaveDisabled = computed(() => {
    // Usar signals para forzar reactividad
    const status = this.formStatus();
    const formInvalid = status !== 'VALID';
    const formPristine = this.form.pristine;
    
    const miniaturaCambio =
      this.fileToUpload() !== null ||
      this.isMarkedForRemoval() ||
      (this.externalUrl() !== '' && this.externalUrl() !== (this.originalCourse?.miniature?.url ?? '')) ||
      (this.selectedTypeThumbnailId() !== (this.originalCourse?.miniature?.type_thumbnail_id ?? null));

    return (formPristine && !miniaturaCambio) || formInvalid || this.saving();
  });

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
    this.loadTypeThumbnails();
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
  private loadTypeThumbnails(): void {
    this.loadingTypes.set(true);
    this.typeService.getTypeThumbnailAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items: TypeThumbnailResponse[]) => {
          this.typeThumbnails.set(items);
          this.loadingTypes.set(false);
        },
        error: (err: Error) => {
          this.errorMsg.set('Error al cargar tipos de miniatura.');
          this.loadingTypes.set(false);
        }
      });
  }
  private idsOrEmpty(arr?: { id: number }[] | null): number[] {
  return Array.isArray(arr) ? arr.map(x => x.id) : [];
}
  onMiniatureChange(file: File | null) {
  this.selectedMiniature = file;

  if (file) {
    // Usuario eligió nueva miniatura → subir
    this.miniatureAction = 'upload';

    const reader = new FileReader();
    reader.onload = () =>
      this.form.patchValue({ miniatureUrl: String(reader.result) });
    reader.readAsDataURL(file);
  } else {
    // Quitó selección local; si no hay miniatura en el curso,
    // dejamos vacío y acción 'none'
    if (!this.course()?.miniature) {
      this.miniatureAction = 'none';
      this.form.patchValue({ miniatureUrl: '' });
    }
  }

  this.form.markAsDirty();
}
removeMiniature(): void {
  // Usuario quiere eliminar la miniatura actual sin subir otra
  this.selectedMiniature = null;
  this.miniatureAction = 'remove';
  this.form.patchValue({ miniatureUrl: '' });
  this.form.markAsDirty();
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
          /* console.log(c) */;
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
      title: c.title ?? '',
      description: c.description ?? '',
      difficulty_id: c.difficulty?.id ?? this.form.controls.difficulty_id.value ?? 1,
      private: !!c.private,
      enabled: !!c.enabled,
      code: c.code ?? '',
      careers: this.idsOrEmpty(c.careers),
      categories: this.idsOrEmpty(c.categories),
      miniatureUrl: c.miniature?.url ?? '', // <- clave: evita leer url si no hay miniatura

    },
    { emitEvent: false }
  );

  // al resetear, limpiamos estado local de archivo/flags
  this.selectedMiniature = null;
  this.miniatureAction = 'none';

  // Poblar estados de miniatura
  if (c.miniature) {
    this.previewImageUrl.set(c.miniature.url);
    this.selectedTypeThumbnailId.set(c.miniature.type_thumbnail_id);
    if (c.miniature.type_thumbnail_id === 1) {
      // URL externa
      this.externalUrl.set(c.miniature.url);
    } else if (c.miniature.type_thumbnail_id === 2) {
      // Archivo físico, no hay URL externa
      this.externalUrl.set('');
    }
  } else {
    this.previewImageUrl.set(null);
    this.selectedTypeThumbnailId.set(null);
    this.externalUrl.set('');
  }
  this.fileToUpload.set(null);
  this.isMarkedForRemoval.set(false);
  
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
    if (this.isSaveDisabled()) {
      console.log('No hay cambios para guardar.');
      return;
    }

    if (this.form.invalid) {
      console.log('El formulario contiene errores. Por favor, revísalo antes de guardar.');
      return;
    } else {
      console.log('Formulario válido, procediendo a guardar...');

       const c = this.course();
       if (!c) {
         this.errorMsg.set('No se encontró el curso para actualizar.');
         return;
       }
       // Respeta límites también en front
  let careers = this.form.value.careers ?? [];
  let categories = this.form.value.categories ?? [];
  careers = Array.isArray(careers) ? [...new Set(careers)].slice(0, this.MAX_CAREERS) : [];
  categories = Array.isArray(categories) ? [...new Set(categories)].slice(0, this.MAX_CATEGORIES) : [];

//   // Construye el payload
  const payload: any = {
    title: this.form.value.title ?? undefined,
    description: this.form.value.description ?? undefined,
    difficulty_id: this.form.value.difficulty_id ?? undefined,
    private: this.form.value.private ?? undefined,
    enabled: this.form.value.enabled ?? undefined,
    code: this.form.value.code ?? undefined,
    careers,
    categories, // si quieres enviar con order, arma [{id, order}]
  };

  // Lógica para miniatura según escenarios
  if (this.isMarkedForRemoval()) {
    // Escenario 5: Eliminar miniatura
    payload.remove_miniature = true;
  } else if (this.fileToUpload()) {
    // Escenario 1 y 2: Nuevo o reemplazar archivo
    payload.type_thumbnail_id = 2;
    payload.miniature = this.fileToUpload();
  } else if (this.selectedTypeThumbnailId() === 1 && this.externalUrl().trim()) {
    // Escenario 3: Cambiar a URL
    payload.type_thumbnail_id = 1;
    payload.url_miniature = this.externalUrl().trim();
  }
  // Escenario 4: No hacer cambios - no enviar nada relacionado con miniatura

  this.saving.set(true);
  this.errorMsg.set(null);
  this.successMsg.set(null);
  this.saved.set(true);
console.log('Payload a enviar:', payload);
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
        console.log('Curso actualizado:');
        this.saved.set(false);
        this.saving.set(false);
        // opcional: cierra modal de miniatura
        this.previewDialogVisible.set(false);
        this.studioBridge.notifyCourseUpdated({
        id: res.course.id,
        title: res.course.title,
        miniatureUrl: res.course.miniature?.url ?? null,
      })
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message || 'No se pudo actualizar el curso.');
        this.saving.set(false);
        this.saved.set(false);
      }
    });
    }      
      
  }

  resetForm(): void {
    if (!this.originalCourse) return;
    this.patchFromCourse(this.originalCourse);
    console.log('Cambios restablecidos.');
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

  // Nuevos métodos para gestión de miniatura
  onTypeThumbnailChange(typeId: number): void {
    this.selectedTypeThumbnailId.set(typeId);
    this.fileToUpload.set(null);
    this.externalUrl.set('');
    this.isMarkedForRemoval.set(false);
    this.form.markAsDirty();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.fileToUpload.set(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImageUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.previewImageUrl.set(null);
    }
    this.isMarkedForRemoval.set(false);
    this.form.markAsDirty();
  }

  onUrlChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.externalUrl.set(target.value);
    this.previewImageUrl.set(target.value || null);
    this.isMarkedForRemoval.set(false);
    this.form.markAsDirty();
  }

  markForRemoval(): void {
    this.isMarkedForRemoval.set(true);
    this.previewImageUrl.set(null);
    this.fileToUpload.set(null);
    this.externalUrl.set('');
    this.form.markAsDirty();
  }

  previewImage(): void {
    this.previewDialogVisible.set(true);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}
