import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SedeService } from '../../../../../core/api/sede/sede.service';
import { Sede, Career, EducationalLevel } from '../../../../../core/api/sede/sede.interface';
import { EducationService } from '../../../../../core/api/profile/education.service';

// === Tipos de tu interfaz ===
export interface EducationalResponse {
  educationalUser: EducationalUser;
}

export interface EducationalUser {
  id: number;
  sede_id: number;
  user_id: number;
  career_id: number;
  educational_level_id: number;
  level: number;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface EducationalRequest {
  sede_id:              number | null;
  career_id:            number | null;
  educational_level_id: number | null;
  level:                number | null;
}

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './education.component.html',
  styleUrl: './education.component.css'
})
export class EducationComponent implements OnInit {
  educationalForm!: FormGroup;

  // === SEDES ===
  sedes: Sede[] = [];
  selectedSedeId: number | null = null;
  selectedSede: Sede | null = null;

  // === CARRERAS (dinámicas según la sede) ===
  careers: Career[] = [];
  selectedCareerId: number | null = null;

  // === NIVELES EDUCATIVOS (educational_levels) ===
  educationalLevels: EducationalLevel[] = [];
  selectedEducationalLevelId: number | null = null;
  selectedEducationalLevel: EducationalLevel | null = null;

  // === NIVELES NUMÉRICOS 1..max_periods (máx 10) ===
  levels: number[] = [];
  selectedLevel: number | null = null;
  maxAllowedLevel: number = 10;

  constructor(
    private fb: FormBuilder,
    private sedeService: SedeService,
    private educationService: EducationService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSedes(); // y desde aquí cargamos la info guardada
  }

  private initForm(): void {
    this.educationalForm = this.fb.group({
      sede_id: [null, Validators.required],
      career_id: [null, Validators.required],
      educational_level_id: [null, Validators.required],
      level: [null, [Validators.required, Validators.min(1)]],
    });
  }

  // ================== CARGA DE DATOS ==================

  private loadSedes(): void {
    this.sedeService.getSedes().subscribe({
      next: (data) => {
        this.sedes = data;
        // Una vez que tenemos sedes, cargamos la info educativa guardada
        this.loadEducationalInformation();
      },
      error: (err) => {
        console.error('Error al cargar sedes', err);
      }
    });
  }

  private loadEducationalInformation(): void {
    this.educationService.getEducationalProfile().subscribe({
      next: (resp: EducationalResponse | any) => {
        const eu: EducationalUser | undefined = (resp?.educationalUser ?? resp) as EducationalUser;

        if (!eu) return;

        // Disparamos toda la lógica de combos en cadena
        this.onSedeChange(eu.sede_id ?? null, eu);
      },
      error: (err) => {
        // Si el usuario aún no tiene datos académicos, simplemente no hacemos nada
        console.info('No hay información académica previa o hubo un error leve:', err?.message ?? err);
      }
    });
  }

  // ================== MANEJO DE CAMBIOS ==================

  /**
   * Cuando cambia la sede desde el select
   * eu es opcional, lo usamos solo cuando cargamos datos previos.
   */
  onSedeChange(sedeId: number | null, eu?: EducationalUser): void {
    this.selectedSedeId = sedeId;
    this.selectedSede = this.sedes.find(s => s.id === sedeId) ?? null;

    // Rellenar carreras y niveles educativos desde la sede seleccionada
    this.careers = this.selectedSede?.careers ?? [];
    this.educationalLevels = this.selectedSede?.educational_unit?.educational_levels ?? [];

    if (eu) {
      // Si venimos de datos guardados, intentamos restaurar selección
      this.selectedCareerId = this.careers.some(c => c.id === eu.career_id) ? eu.career_id : null;

      this.selectedEducationalLevelId = this.educationalLevels.some(el => el.id === eu.educational_level_id)
        ? eu.educational_level_id
        : null;

      this.selectedLevel = eu.level ?? null;

      if (this.selectedEducationalLevelId) {
        this.onEducationalLevelChange(this.selectedEducationalLevelId, false);
      } else {
        this.selectedEducationalLevel = null;
        this.updateLevelsOptions();
      }
    } else {
      // Si es un cambio manual del usuario, reseteamos dependientes
      this.selectedCareerId = null;
      this.selectedEducationalLevelId = null;
      this.selectedEducationalLevel = null;
      this.selectedLevel = null;
      this.updateLevelsOptions();
    }

    // Sincronizamos el form (por si usas validaciones reactivas)
    this.educationalForm.patchValue({
      sede_id: this.selectedSedeId,
      career_id: this.selectedCareerId,
      educational_level_id: this.selectedEducationalLevelId,
      level: this.selectedLevel
    }, { emitEvent: false });
  }

  /**
   * Cuando el usuario selecciona un educational_level (tipo de estudio/período).
   */
  onEducationalLevelChange(levelId: number | null, patchForm: boolean = true): void {
    this.selectedEducationalLevelId = levelId;
    this.selectedEducationalLevel = this.educationalLevels.find(el => el.id === levelId) ?? null;

    this.updateLevelsOptions();

    if (patchForm) {
      this.educationalForm.patchValue({
        educational_level_id: this.selectedEducationalLevelId,
        level: this.selectedLevel
      }, { emitEvent: false });
    }
  }

  /**
   * Calcula cuántos niveles (1..max_periods, máximo 10) puede elegir el usuario.
   */
  private updateLevelsOptions(): void {
    const maxFromLevel = this.selectedEducationalLevel?.max_periods ?? 10;
    const safeMax = Math.min(Math.max(maxFromLevel, 1), 10); // clamp 1..10

    this.maxAllowedLevel = safeMax;
    this.levels = Array.from({ length: safeMax }, (_, i) => i + 1);

    // Si el nivel previamente seleccionado excede el máximo, lo ajustamos
    if (this.selectedLevel && this.selectedLevel > safeMax) {
      this.selectedLevel = safeMax;
    }
  }

  // ================== GUARDAR ==================

  onSubmitEducational(): void {
    if (!this.selectedSedeId || !this.selectedCareerId || !this.selectedEducationalLevelId || !this.selectedLevel) {
      alert('Completa sede, carrera, período y nivel.');
      return;
    }

    // Validar contra max_periods por seguridad extra
    const max = this.selectedEducationalLevel?.max_periods ?? 10;
    if (this.selectedLevel > max) {
      alert(`El nivel máximo permitido para este período es ${max}.`);
      return;
    }

    const payload: EducationalRequest = {
      sede_id: this.selectedSedeId,
      career_id: this.selectedCareerId,
      educational_level_id: this.selectedEducationalLevelId,
      level: this.selectedLevel,
    };

    this.educationService.updateEducationalProfile(payload).subscribe({
      next: () => alert('✅ Información académica actualizada'),
      error: err => {
        console.error(err);
        alert('❌ No se pudo actualizar la información académica');
      }
    });
  }
}
