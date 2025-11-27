import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProvincesService } from '../../../../../core/services/provinces/provinces.service';
import { Provincia, Canton, Parroquia } from '../../../../../core/services/provinces/provinces.interface';
import { InformationService } from '../../../../../core/api/profile/information.service';

import {
  InformationRequest,
  UserInformation
} from '../../../../../core/api/profile/information.interface';

@Component({
  selector: 'app-information',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './information.component.html',
  styleUrl: './information.component.css'
})
export class InformationComponent implements OnInit {
  personalForm!: FormGroup;

  // Ubicación
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  parroquias: Parroquia[] = [];

  selectedProvinciaId = '';
  selectedCantonId = '';
  selectedParishId = '';

  // Fecha / Teléfono
  viewPhone = '';
  viewBirthdate: string | null = null;
  today = new Date().toISOString().slice(0, 10);

  // Datos previos
  private lastInfo: UserInformation | null = null;

  // Campos extra (selects)
  sexo = '';
  estadoCivil = '';
  discapacidad = '';
  discapacidadPermanente: string | null = null;
  asistenciaDisc: string | null = null;

  // Mensaje de error visual
  submitError: string | null = null;

  // Opciones
  sexoOptions = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
  ];

  estadoCivilOptions = [
    { value: 'casado/a', label: 'Casado/a' },
    { value: 'unido/a', label: 'Unido/a' },
    { value: 'separado/a', label: 'Separado/a' },
    { value: 'divorciado/a', label: 'Divorciado/a' },
    { value: 'viudo/a', label: 'Viudo/a' },
    { value: 'soltero/a', label: 'Soltero/a' },
  ];

  discapacidadOptions = [
    { value: 'si', label: 'Sí' },
    { value: 'no', label: 'No' },
  ];

  discapacidadPermanenteOptions: string[] = [
    'intelectual (retraso mental)',
    'físico-motora (parálisis y amputaciones)',
    'visual (ceguera)',
    'auditiva (sordera)',
    'mental (enfermedades psiquiátricas)',
    'otro tipo',
  ];

  asistenciaDiscOptions = [
    { value: 'si', label: 'Sí' },
    { value: 'no', label: 'No' },
  ];

  // Defaults para primera vez
  private readonly DEFAULTS = {
    sexo: 'masculino' as 'masculino',
    estado_civil: 'soltero/a' as 'soltero/a',
    discapacidad: 'no' as 'no',
  };

  constructor(
    private fb: FormBuilder,
    private provincesService: ProvincesService,
    private informationService: InformationService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProvinces();
    this.loadUserInformation();
  }

  private initForm(): void {
    // mantenemos el form por compatibilidad
    this.personalForm = this.fb.group({
      birthdate: [null],
      phone_number: [null, [Validators.maxLength(20)]],
      province: [null],
      canton: [null],
      parish: [null],
    });
  }

  // ---------- Carga inicial ----------
  private loadProvinces(): void {
    this.provincesService.getProvincias().subscribe(prov => this.provincias = prov);
  }

  private loadUserInformation(): void {
    this.informationService.getUserProfile().subscribe(data => {
      this.lastInfo = data;

      // Preselección por NOMBRE (lo que devuelve tu API)
      const prov = this.provincias.find(p => p.nombre === data.province);
      if (prov) {
        this.selectedProvinciaId = prov.id;
        this.cantones = prov.cantones;
        const canton = prov.cantones.find(c => c.nombre === data.canton);
        if (canton) {
          this.selectedCantonId = canton.id;
          this.parroquias = canton.parroquias;
          const parish = canton.parroquias.find(pq => pq.nombre === data.parish);
          if (parish) this.selectedParishId = parish.id;
        }
      }

      // Fecha (tu backend usa 'YYYY-MM-DD')
      this.viewBirthdate = data.birthdate ?? null;

      // Teléfono: mostrar con 0 si corresponde
      const apiPhone = data.phone_number || '';
      if (apiPhone.startsWith('+593')) {
        const local = apiPhone.replace('+593', '').trim();
        this.viewPhone = local.startsWith('9') ? '0' + local : local;
      } else {
        this.viewPhone = apiPhone ?? '';
      }

      // Campos extra
      this.sexo = data.sexo || '';
      this.estadoCivil = data.estado_civil || '';
      this.discapacidad = data.discapacidad || '';
      this.discapacidadPermanente = data.discapacidad_permanente;
      this.asistenciaDisc = data.asistencia_establecimiento_discapacidad;
    });
  }

  // ---------- Cascada ubicación ----------
  onProvinciaChange(): void {
    const provincia = this.provincias.find(p => p.id === this.selectedProvinciaId);
    this.cantones = provincia?.cantones || [];
    this.selectedCantonId = '';
    this.parroquias = [];
    this.selectedParishId = '';
  }

  onCantonChange(): void {
    const canton = this.cantones.find(c => c.id === this.selectedCantonId);
    this.parroquias = canton?.parroquias || [];
    this.selectedParishId = '';
  }

  // ---------- Teléfono ----------
  onPhoneInput(): void {
    this.viewPhone = (this.viewPhone || '').replace(/\D+/g, '').slice(0, 10);
  }

  private normalizePhoneForApi(view: string): string | null {
    const digits = (view || '').replace(/\D+/g, '');
    if (!digits) return null;
    const noZero = digits.startsWith('0') ? digits.slice(1) : digits;
    return `+593${noZero}`;
  }

  // ---------- Discapacidad ----------
  onDiscapacidadChange(): void {
    if (this.discapacidad !== 'si') {
      this.discapacidadPermanente = null;
      this.asistenciaDisc = null;
    }
  }

  // ---------- Guardar ----------
  onSubmitPersonal(): void {
    this.submitError = null;

    // Validaciones previas (coinciden con tu backend)
    if (!this.viewBirthdate) {
      this.submitError = 'La fecha de nacimiento es obligatoria.';
      alert(this.submitError); return;
    }

    const phone = this.normalizePhoneForApi(this.viewPhone);
    if (!phone || !/^\+593[0-9]{9}$/.test(phone)) {
      this.submitError = 'El número telefónico debe tener el formato +593XXXXXXXXX.';
      alert(this.submitError); return;
    }

    const provinceName = this.provincias.find(p => p.id === this.selectedProvinciaId)?.nombre ?? null;
    const cantonName   = this.cantones.find(c => c.id === this.selectedCantonId)?.nombre ?? null;
    const parishName   = this.parroquias.find(pq => pq.id === this.selectedParishId)?.nombre ?? null;

    if (!provinceName) { alert('Selecciona una provincia.'); return; }
    if (!cantonName)   { alert('Selecciona un cantón.'); return; }
    if (!parishName)   { alert('Selecciona una parroquia.'); return; }

    const sexo = this.sexo || this.lastInfo?.sexo || this.DEFAULTS.sexo;
    const estadoCivil = this.estadoCivil || this.lastInfo?.estado_civil || this.DEFAULTS.estado_civil;
    const discapacidad = this.discapacidad || this.lastInfo?.discapacidad || this.DEFAULTS.discapacidad;

    if (!sexo)         { alert('Selecciona sexo.'); return; }
    if (!estadoCivil)  { alert('Selecciona estado civil.'); return; }
    if (!discapacidad) { alert('Selecciona si tiene discapacidad.'); return; }

    // Condicionales de discapacidad
    let discPerm: string | null = null;
    let asisteDisc: string | null = null;
    if (discapacidad === 'si') {
      if (!this.discapacidadPermanente) {
        alert('Selecciona el tipo de discapacidad.'); return;
      }
      if (!this.asistenciaDisc) {
        alert('Indica si asiste a un establecimiento de discapacidad.'); return;
      }
      discPerm = this.discapacidadPermanente;
      asisteDisc = this.asistenciaDisc;
    }

    const payload: InformationRequest = {
      birthdate: this.viewBirthdate,
      phone_number: phone,
      province: provinceName,
      canton: cantonName,
      parish: parishName,
      sexo,
      estado_civil: estadoCivil,
      discapacidad,
      discapacidad_permanente: discPerm,
      asistencia_establecimiento_discapacidad: asisteDisc,
    };

    this.informationService.updateUserProfile(payload).subscribe({
      next: () => {
        alert('✅ Información personal actualizada');
      },
      error: (err) => {
        // Muestra el primer error devuelto por Laravel si es 422
        const e = err?.error;
        if (e?.errors) {
          const firstKey = Object.keys(e.errors)[0];
          const firstMsg = e.errors[firstKey]?.[0] || e.message;
          alert(firstMsg || 'Error al actualizar la información del perfil');
        } else {
          alert(e?.message || err.message || 'Error al actualizar la información del perfil');
        }
      }
    });
  }

  // trackBy para listas
  trackById = (_: number, item: any) => item?.id ?? item;
}
