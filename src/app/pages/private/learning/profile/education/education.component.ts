import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import {
  EducationalUser,
  EducationalRequest
} from '../../../../../core/api/profile/education.interface';
import {
  Sede,
  Career,
  EducationalLevel as SedeEducationalLevel
} from '../../../../../core/api/sede/sede.interface';

import { EducationService } from '../../../../../core/api/profile/education.service';
import { SedeService } from '../../../../../core/api/sede/sede.service';
import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    ToastComponent,
    LoadingBarComponent
  ],
  templateUrl: './education.component.html',
  styleUrl: './education.component.css'
})
export class EducationComponent implements OnInit {

  // Barra de carga al guardar
  save = false;

  // Carga inicial (skeletor)
  loading = true;

  // Modo edición
  editing = false;

  // Modal de confirmación
  confirmVisible = false;

  // Datos actuales del usuario
  educationalUser: EducationalUser | null = null;

  // Listado de sedes visibles para el usuario
  sedes: Sede[] = [];

  // Sede seleccionada en el formulario
  selectedSede: Sede | null = null;

  // Carreras y niveles educativos disponibles según la sede
  availableCareers: Career[] = [];
  availableEducationalLevels: SedeEducationalLevel[] = [];

  // Límite máximo permitido para el nivel
  maxLevelAllowed: number | null = null;

  // Formulario reactivo
  form!: FormGroup;

  // Skeleton rows
  skeletonRows = [1, 2, 3];

  constructor(
    private fb: FormBuilder,
    private educationService: EducationService,
    private sedeService: SedeService,
    private toast: UiToastService
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
      career_id: [null], // requerido solo si la sede tiene carreras y se escoge una
      educational_level_id: [null, Validators.required],
      level: [null] // requisitos dinámicos según maxLevelAllowed
    });
  }

  private loadData(): void {
    this.loading = true;

    // Carga en paralelo: perfil educativo + sedes
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
            this.toast.add({
              severity: 'danger',
              summary: 'Error',
              message: 'No se pudo cargar tu información educativa.'
            });
          }
        });
      },
      error: () => {
        this.loading = false;
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: 'No se pudieron cargar las sedes disponibles.'
        });
      }
    });
  }

  private patchFormFromUser(): void {
    if (!this.educationalUser) {
      // Sin datos aún: dejamos el formulario vacío
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

    // Configuramos sede seleccionada + listas derivadas
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
  // Helpers para modo vista / edición
  // ---------------------------------------------------------

  get hasEducationalInfo(): boolean {
    return !!this.educationalUser;
  }

  onEdit(): void {
    this.editing = true;
    this.patchFormFromUser();
  }

  onCancel(): void {
    this.editing = false;
    this.confirmVisible = false;
    this.patchFormFromUser();
  }

  // ---------------------------------------------------------
  // Cambio de sede / nivel / carrera
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
  // public selectedEducationalLevel: EducationalLevel | null = null;
  public get selectedEducationalLevel(): SedeEducationalLevel | null {
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

    // Si el nivel educativo no tiene max_periods, asumimos que no se requiere nivel
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
  // Submit + Confirmación
  // ---------------------------------------------------------

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({
        severity: 'warn',
        summary: 'Validación',
        message: 'Revisa los campos marcados antes de guardar.'
      });
      return;
    }

    // Abrimos ventana de confirmación
    this.confirmVisible = true;
  }

  onConfirmUpdate(): void {
    this.confirmVisible = false;
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
        this.editing = false;
        this.toast.add({
          severity: 'primary',
          summary: 'Actualizado',
          message: 'Tu información educativa se actualizó correctamente.'
        });
      },
      error: () => {
        this.save = false;
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: 'No se pudo actualizar tu información educativa.'
        });
      }
    });
  }

  // Helpers de template para errores
  hasError(controlName: string, error: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(error);
  }
}
