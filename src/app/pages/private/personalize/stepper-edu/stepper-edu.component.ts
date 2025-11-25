import {
  Component,
  OnInit,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { LoadingBarComponent } from '../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import {
  EducationalRequest,
  EducationalUser,
  EducationalLevel,
  Career
} from '../../../../core/api/profile/education.interface';
import { EducationService } from '../../../../core/api/profile/education.service';
import { AuthService } from '../../../../core/api/auth/auth.service';

import { forkJoin, of, catchError } from 'rxjs';

interface SedeOption {
  id: number;
  label: string;
  subtitle: string;
  logoUrl: string;
}

@Component({
  selector: 'app-stepper-edu',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingBarComponent
  ],
  templateUrl: './stepper-edu.component.html',
  styleUrl: './stepper-edu.component.css'
})
export class StepperEduComponent implements OnInit {

  // Barra de guardado
  saving = signal(false);

  // Skeleton de carga inicial
  isLoading = signal(true);
  skeletonRows = Array.from({ length: 3 }).map((_, i) => i);

  // Formulario
  eduForm!: FormGroup;

  // Opciones
  sedeOptions: SedeOption[] = [];
  careersBySedeId: Record<number, Career[]> = {};
  filteredCareers: Career[] = [];
  educationalLevels: EducationalLevel[] = [];
  levelOptions: number[] = [];

  // Vista de sede seleccionada
  selectedSedeLogo: string | null = null;
  selectedSedeSubtitle: string | null = null;

  constructor(
    private fb: FormBuilder,
    private educationService: EducationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadStaticOptions();  // Mock de sedes/carreras/niveles
    this.loadInitialData();    // Perfil educativo si ya existe
  }

  // ------------------------
  // Form
  // ------------------------
  private buildForm(): void {
    this.eduForm = this.fb.group({
      sede_id: [null, Validators.required],
      career_id: [null, Validators.required],
      educational_level_id: [null, Validators.required],
      level: [null, [Validators.required, Validators.min(1)]],
    });

    // Cambia de nivel → recalcular periodos
    this.eduForm.get('educational_level_id')?.valueChanges.subscribe((id: number) => {
      const lvl = this.educationalLevels.find(l => l.id === id);
      const max = lvl?.max_periods ?? 10;
      this.levelOptions = Array.from({ length: max }, (_, i) => i + 1);

      if (this.eduForm.value.level && this.eduForm.value.level > max) {
        this.eduForm.patchValue({ level: null });
      }
    });
  }

  // ------------------------
  // Datos "mock" para sedes / carreras / niveles
  // (luego lo sustituyes por tu API de catálogos)
  // ------------------------
  private loadStaticOptions(): void {
    const today = new Date();

    this.sedeOptions = [
      {
        id: 1,
        label: 'ESPAM MFL - Sede Matriz',
        subtitle: 'Calceta, Manabí · Educación superior',
        logoUrl: 'assets/images/logos/espam-mfl.png'
      },
      {
        id: 2,
        label: 'Unidad Educativa San José de Manta',
        subtitle: 'Manta, Manabí · Bachillerato',
        logoUrl: 'assets/images/logos/san-jose-manta.png'
      }
    ];

    this.careersBySedeId = {
      1: [
        {
          id: 1,
          name: 'Ingeniería en Computación',
          max_semesters: 10,
          url_logo: '',
          created_at: today,
          updated_at: today,
          deleted_at: null
        },
        {
          id: 2,
          name: 'Ingeniería Agronómica',
          max_semesters: 10,
          url_logo: '',
          created_at: today,
          updated_at: today,
          deleted_at: null
        }
      ],
      2: [
        {
          id: 3,
          name: 'Bachillerato en Ciencias',
          max_semesters: 3,
          url_logo: '',
          created_at: today,
          updated_at: today,
          deleted_at: null
        },
        {
          id: 4,
          name: 'Bachillerato Técnico',
          max_semesters: 3,
          url_logo: '',
          created_at: today,
          updated_at: today,
          deleted_at: null
        }
      ]
    };

    this.educationalLevels = [
      {
        id: 1,
        name: 'Bachillerato',
        description: 'Educación secundaria',
        period: 'año',
        max_periods: 3,
        created_at: today,
        updated_at: today
      },
      {
        id: 2,
        name: 'Pregrado',
        description: 'Educación superior universitaria',
        period: 'semestre',
        max_periods: 10,
        created_at: today,
        updated_at: today
      }
    ];
  }

  // ------------------------
  // Carga inicial
  // ------------------------
  private loadInitialData(): void {
    this.isLoading.set(true);

    const edu$ = this.educationService.getEducationalProfile().pipe(
      catchError(err => {
        console.warn('No hay datos educativos previos o hubo error:', err);
        return of(null);
      })
    );

    forkJoin({
      edu: edu$
    }).subscribe({
      next: ({ edu }) => {
        this.fillEduForm(edu);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando datos educativos iniciales', error);
        this.isLoading.set(false);
      },
    });
  }

  private fillEduForm(edu: EducationalUser | null): void {
    if (!edu) return;

    const sedeId = edu.sede_id ?? edu.sede?.id;
    const careerId = edu.career_id ?? edu.career?.id;
    const levelId = edu.educational_level_id ?? edu.educational_level?.id;

    if (sedeId) {
      this.eduForm.patchValue({ sede_id: sedeId }, { emitEvent: false });
      this.onSedeSelected(sedeId);
    }

    if (careerId) {
      this.eduForm.patchValue({ career_id: careerId }, { emitEvent: false });
    }

    if (levelId) {
      this.eduForm.patchValue({ educational_level_id: levelId }, { emitEvent: true });
      const lvl = this.educationalLevels.find(l => l.id === levelId);
      const max = lvl?.max_periods ?? 10;
      this.levelOptions = Array.from({ length: max }, (_, i) => i + 1);
    }

    if (edu.level) {
      this.eduForm.patchValue({ level: edu.level }, { emitEvent: false });
    }

    if (sedeId) {
      const sede = this.sedeOptions.find(s => s.id === sedeId);
      this.selectedSedeLogo = sede?.logoUrl ?? null;
      this.selectedSedeSubtitle = sede?.subtitle ?? null;
    }
  }

  // ------------------------
  // SelectButton "custom"
  // ------------------------
  onSelectSede(option: SedeOption): void {
    this.eduForm.patchValue({ sede_id: option.id });
    this.eduForm.get('sede_id')?.markAsDirty();
    this.eduForm.get('sede_id')?.markAsTouched();

    this.onSedeSelected(option.id);
  }

  private onSedeSelected(sedeId: number): void {
    this.filteredCareers = this.careersBySedeId[sedeId] ?? [];
    this.eduForm.patchValue({ career_id: null }, { emitEvent: false });

    const sede = this.sedeOptions.find(s => s.id === sedeId);
    this.selectedSedeLogo = sede?.logoUrl ?? null;
    this.selectedSedeSubtitle = sede?.subtitle ?? null;
  }

  isSedeSelected(id: number): boolean {
    return this.eduForm.value.sede_id === id;
  }

  // ------------------------
  // Submit
  // ------------------------
  onSubmitEdu(): void {
    if (this.eduForm.invalid) {
      this.eduForm.markAllAsTouched();
      return;
    }

    const payload: EducationalRequest = {
      sede_id: this.eduForm.value.sede_id,
      career_id: this.eduForm.value.career_id,
      educational_level_id: this.eduForm.value.educational_level_id,
      level: this.eduForm.value.level,
    };

    this.saving.set(true);
    this.educationService.updateEducationalProfile(payload).subscribe({
      next: (updated: EducationalUser) => {
        this.saving.set(false);
        console.log('Datos educativos actualizados', updated);

        this.authService.updateCurrentUser({
          has_educational_user: true
        });

        this.router.navigate(['/personalize/interest'], {
          relativeTo: this.route
        });
      },
      error: (error) => {
        this.saving.set(false);
        console.error('Error al actualizar datos educativos', error);
      },
    });
  }

  // ------------------------
  // Helpers UI
  // ------------------------
  fieldInvalid(controlName: string): boolean {
    const control = this.eduForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getPeriodSuffix(n: number): string {
    return '°';
  }
}
