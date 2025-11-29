import {
  Component,
  OnInit,
  Optional
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { LoadingBarComponent } from '../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import {
  EducationalUser,
  EducationalRequest
} from '../../../../core/api/profile/education.interface';
import { EducationService } from '../../../../core/api/profile/education.service';

import {
  Sede,
  Career,
  EducationalLevel as SedeEducationalLevel
} from '../../../../core/api/sede/sede.interface';
import { SedeService } from '../../../../core/api/sede/sede.service';

import { AuthService } from '../../../../core/api/auth/auth.service';
import { PersonalizeComponent } from '../personalize.component';

@Component({
  selector: 'app-stepper-edu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingBarComponent],
  templateUrl: './stepper-edu.component.html',
  styleUrl: './stepper-edu.component.css'
})
export class StepperEduComponent implements OnInit {

  // Barra de carga global al guardar
  save = false;

  // Carga inicial (skeletor)
  loading = true;

  // Error general de carga/submit
  submitError: string | null = null;

  // Formulario
  form!: FormGroup;

  // Skeleton
  skeletonRows = [1, 2, 3];

  // Datos educativos actuales (si existen)
  educationalUser: EducationalUser | null = null;

  // Sedes y derivados
  sedes: Sede[] = [];
  selectedSede: Sede | null = null;
  availableCareers: Career[] = [];
  availableEducationalLevels: SedeEducationalLevel[] = [];
  maxLevelAllowed: number | null = null;

  constructor(
    private fb: FormBuilder,
    private educationService: EducationService,
    private sedeService: SedeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Optional() private personalizeParent: PersonalizeComponent
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  // ---------------------------------------------------------
  // Inicialización
  // ---------------------------------------------------------

  private initForm(): void {
    this.form = this.fb.group({
      sede_id: [null, Validators.required],
      career_id: [null],
      educational_level_id: [null, Validators.required],
      level: [null] // validación dinámica
    });
  }

  private loadData(): void {
    this.loading = true;
    this.submitError = null;

    this.sedeService.getSedes().subscribe({
      next: sedes => {
        this.sedes = sedes ?? [];

        this.educationService.getEducationalProfile().subscribe({
          next: eduUser => {
            this.educationalUser = eduUser;
            this.patchFormFromUser();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.submitError = 'No se pudo cargar tu información educativa inicial.';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.submitError = 'No se pudieron cargar las sedes disponibles.';
      }
    });
  }

  private patchFormFromUser(): void {
    if (!this.educationalUser) {
      this.form.reset({
        sede_id: null,
        career_id: null,
        educational_level_id: null,
        level: null
      });
      this.selectedSede = null;
      this.availableCareers = [];
      this.availableEducationalLevels = [];
      this.maxLevelAllowed = null;
      return;
    }

    const u = this.educationalUser;

    this.form.patchValue({
      sede_id: u.sede_id ?? null,
      career_id: u.career_id ?? null,
      educational_level_id: u.educational_level_id ?? null,
      level: u.level ?? null
    });

    if (u.sede_id) {
      this.selectedSede =
        this.sedes.find(s => s.id === u.sede_id) ?? null;
    } else {
      this.selectedSede = null;
    }

    this.updateDerivedLists();
    this.updateLevelValidation();
  }

  // ---------------------------------------------------------
  // Helpers de selección
  // ---------------------------------------------------------

  onChangeSede(value: string | number): void {
    const sedeId = Number(value) || null;

    this.form.patchValue({
      sede_id: sedeId,
      career_id: null,
      educational_level_id: null,
      level: null
    });

    this.selectedSede =
      this.sedes.find(s => s.id === sedeId) ?? null;

    this.updateDerivedLists();
    this.updateLevelValidation();
  }

  onChangeEducationalLevel(value: string | number): void {
    const levelId = Number(value) || null;
    this.form.patchValue({ educational_level_id: levelId, level: null });
    this.updateLevelValidation();
  }

  onChangeCareer(value: string | number): void {
    const careerId = Number(value) || null;
    this.form.patchValue({ career_id: careerId, level: null });
    this.updateLevelValidation();
  }

  private updateDerivedLists(): void {
    if (this.selectedSede && this.selectedSede.educational_unit) {
      this.availableEducationalLevels =
        this.selectedSede.educational_unit.educational_levels ?? [];
    } else {
      this.availableEducationalLevels = [];
    }

    this.availableCareers = this.selectedSede?.careers ?? [];
  }

  private get selectedEducationalLevel(): SedeEducationalLevel | null {
    const id = this.form.get('educational_level_id')?.value;
    if (!id || !this.availableEducationalLevels) return null;
    return (
      this.availableEducationalLevels.find(l => l.id === id) ?? null
    );
  }

  private get selectedCareer(): Career | null {
    const id = this.form.get('career_id')?.value;
    if (!id || !this.availableCareers) return null;
    return this.availableCareers.find(c => c.id === id) ?? null;
  }

  private updateLevelValidation(): void {
    const ctrl = this.form.get('level');
    if (!ctrl) return;

    const eduLevel = this.selectedEducationalLevel;
    const career = this.selectedCareer;

    // Si el nivel educativo no tiene max_periods, no pedimos "level"
    if (!eduLevel || !eduLevel.max_periods || eduLevel.max_periods <= 0) {
      this.maxLevelAllowed = null;
      ctrl.clearValidators();
      ctrl.setValue(null);
      ctrl.updateValueAndValidity({ emitEvent: false });
      return;
    }

    let max = eduLevel.max_periods;

    if (career && career.max_semesters && career.max_semesters > 0) {
      max = Math.min(max, career.max_semesters);
    }

    this.maxLevelAllowed = max;

    const validators = [Validators.required, Validators.min(1), Validators.max(max)];
    ctrl.setValidators(validators);

    const currentVal = ctrl.value;
    if (currentVal != null && (currentVal < 1 || currentVal > max)) {
      ctrl.setValue(max);
    }

    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------

  onSubmit(): void {
    this.submitError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: EducationalRequest = {
      sede_id: this.form.value.sede_id ?? null,
      career_id: this.form.value.career_id ?? null,
      educational_level_id: this.form.value.educational_level_id ?? null,
      level: this.form.value.level ?? null
    };

    this.save = true;

    this.educationService.updateEducationalProfile(payload).subscribe({
      next: updated => {
        this.educationalUser = updated;
        this.save = false;
        this.onCompletedStep();
      },
      error: () => {
        this.save = false;
        this.submitError = 'No se pudo guardar tu información educativa. Inténtalo nuevamente.';
      }
    });
  }

  /**
   * Marca el flag has_educational_user y avanza al siguiente paso.
   */
  private onCompletedStep(): void {
    // Actualizamos el usuario actual en AuthService / localStorage
    this.authService.updateCurrentUser({
      has_educational_user: true
    });

    // Si tenemos referencia al padre, usamos su método
    if (this.personalizeParent) {
      this.personalizeParent.onStepCompleted('education');
    } else {
      // Fallback: navegar manualmente al siguiente paso
      this.router.navigate(['../interest'], {
        relativeTo: this.route
      });
    }
  }

  // Helpers de errores para el template
  hasError(controlName: string, error: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(error);
  }

  // Exponer el nivel educativo seleccionado al template
  get currentEducationalLevel(): SedeEducationalLevel | null {
    return this.selectedEducationalLevel;
  }
}

