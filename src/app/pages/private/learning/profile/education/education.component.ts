import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { SedeService } from '../../../../../core/api/sede/sede.service';
import { Sede } from '../../../../../core/api/sede/sede.interface';
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
  // ... (otros anidados no los usamos aquí)
}
export interface EducationalRequest {
  sede_id:              number | null;
  career_id:            number | null;
  educational_level_id: number | null;
  level:                number | null;
}

type Career = { id: number; name: string };

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './education.component.html',
  styleUrl: './education.component.css'
})
export class EducationComponent implements OnInit {
  educationalForm!: FormGroup;

  // Selects
  sedes: Sede[] = [];
  selectedSedeId: number | null = null;

  careers: Career[] = [
    { id: 1,  name: 'Ingeniería Agrícola' },
    { id: 2,  name: 'Agroindustria' },
    { id: 3,  name: 'Ingeniería Ambiental' },
    { id: 4,  name: 'Computación' },
    { id: 5,  name: 'Administración de Empresas' },
    { id: 6,  name: 'Administración Pública' },
    { id: 7,  name: 'Turismo y Hotelería' },
    { id: 8,  name: 'Medicina Veterinaria' },
    { id: 9,  name: 'Ingeniería Agroforestal' },
    { id: 10, name: 'Electrónica y Automatización' },
    { id: 11, name: 'Ing. en Riesgos de Desastres' },
    { id: 12, name: 'Ingeniería de la Producción' },
    { id: 13, name: 'Ingeniería en Biotecnología' },
    { id: 14, name: 'Marketing Digital' },
    { id: 15, name: 'Gestión de la Innovación' },
    { id: 16, name: 'Gastronomía' },
  ];
  selectedCareerId: number | null = null;

  // Niveles 1..10
  levels: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
  selectedLevel: number | null = null;

  // educational_level_id (si tu backend lo requiere; aquí lo igualamos a level)
  selectedEducationalLevelId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private sedeService: SedeService,
    private educationService: EducationService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSedes();
    this.loadEducationalInformation();
  }

  private initForm(): void {
    // Lo mantenemos para validaciones si luego migras a reactivo puro
    this.educationalForm = this.fb.group({
      sede_id: [null, Validators.required],
      career_id: [null, Validators.required],
      educational_level_id: [null],                 // opcional
      level: [null, [Validators.required, Validators.min(1)]],
    });
  }

  private loadSedes(): void {
    this.sedeService.getSedes().subscribe(data => this.sedes = data);
  }

  private loadEducationalInformation(): void {
    this.educationService.getEducationalProfile().subscribe((resp: EducationalResponse | any) => {
      // Si ya te llega con el envoltorio educationalUser, lo extraemos.
      const eu: EducationalUser = (resp?.educationalUser ?? resp) as EducationalUser;

      // Sincroniza selects
      this.selectedSedeId = eu?.sede_id ?? null;
      this.selectedCareerId = eu?.career_id ?? null;
      this.selectedLevel = eu?.level ?? null;
      this.selectedEducationalLevelId = eu?.educational_level_id ?? (this.selectedLevel ?? null);

      // (Opcional) Sincroniza el form para validaciones
      this.educationalForm.patchValue({
        sede_id: this.selectedSedeId,
        career_id: this.selectedCareerId,
        level: this.selectedLevel,
        educational_level_id: this.selectedEducationalLevelId
      });
    });
  }

  onSubmitEducational(): void {
    // Validación rápida (como usamos ngModel standalone, validamos manual)
    if (!this.selectedSedeId || !this.selectedCareerId || !this.selectedLevel) {
      alert('Completa sede, carrera y nivel.');
      return;
    }

    // Mapeo exacto a EducationalRequest
    const payload: EducationalRequest = {
      sede_id: this.selectedSedeId,
      career_id: this.selectedCareerId,
      level: this.selectedLevel,
      // si tu API requiere educational_level_id, aquí lo igualamos al nivel seleccionado
      educational_level_id: this.selectedEducationalLevelId ?? this.selectedLevel
    };

    this.educationService.updateEducationalProfile(payload).subscribe({
      next: () => alert('✅ Información académica actualizada'),
      error: err => alert(err.message)
    });
  }
}
