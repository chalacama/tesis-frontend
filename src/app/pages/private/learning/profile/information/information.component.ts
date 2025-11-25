import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProvincesService } from '../../../../../core/services/provinces/provinces.service';
import { Provincia, Canton, Parroquia } from '../../../../../core/services/provinces/provinces.interface';
import { InformationService } from '../../../../../core/api/profile/information.service';
import { CountryCode } from '../../../../../core/services/code-country/code.country';

// 👇 importa las interfaces para tipar/localmente (opcional pero recomendado)
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

  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  parroquias: Parroquia[] = [];

  selectedProvinciaId = '';
  selectedCantonId = '';
  selectedParishId = '';

  // Estado de vista extra
  viewPhone = '';
  viewBirthdate: string | null = null;
  today = new Date().toISOString().slice(0,10);

  // Guardamos lo que vino del backend para re-enviarlo
  private lastInfo: UserInformation | null = null;

  // Defaults válidos para el tipo (por si es la 1ª vez y no hay datos en backend)
  private readonly DEFAULTS = {
    sexo: 'masculino' as 'masculino',
    estado_civil: 'soltero/a' as 'soltero/a',
    discapacidad: 'no' as 'no',
    discapacidad_permanente: null as string | null,
    asistencia_establecimiento_discapacidad: null as string | null,
  };

  countries: CountryCode = {
    name: 'Ecuador', code: 'EC', phoneCode: '+593', flagEmoji: '🇪🇨'
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
    this.personalForm = this.fb.group({
      birthdate: [null],
      phone_number: [null, [Validators.maxLength(20)]],
      province: [null],
      canton: [null],
      parish: [null],
    });
  }

  private loadProvinces(): void {
    this.provincesService.getProvincias().subscribe(prov => this.provincias = prov);
  }

  private loadUserInformation(): void {
    this.informationService.getUserProfile().subscribe(data => {
      // Guarda última info para reusar campos obligatorios
      this.lastInfo = data;

      // Rellena form
      this.personalForm.patchValue(data);

      // Selects en cascada
      this.selectedProvinciaId = (data.province as any) || '';
      this.updateCantones();

      this.selectedCantonId = (data.canton as any) || '';
      this.updateParroquias();

      this.selectedParishId = (data.parish as any) || '';

      // Fecha
      this.viewBirthdate = (data as any)?.birthdate ?? null;

      // Teléfono: si viene +593XXXX, mostrar 0XXXX
      const apiPhone = (data as any)?.phone_number as string | null;
      if (apiPhone?.startsWith('+593')) {
        const local = apiPhone.replace('+593', '').trim();
        this.viewPhone = local.startsWith('9') ? '0' + local : local;
      } else {
        this.viewPhone = apiPhone ?? '';
      }
    });
  }

  // Cascada provincia/cantón/parroquia
  onProvinciaChange(): void {
    this.updateCantones();
    this.selectedCantonId = '';
    this.parroquias = [];
    this.selectedParishId = '';
  }

  onCantonChange(): void {
    this.updateParroquias();
    this.selectedParishId = '';
  }

  private updateCantones(): void {
    const provincia = this.provincias.find(p => p.id === this.selectedProvinciaId);
    this.cantones = provincia?.cantones || [];
  }

  private updateParroquias(): void {
    const canton = this.cantones.find(c => c.id === this.selectedCantonId);
    this.parroquias = canton?.parroquias || [];
  }

  // Sanitiza teléfono (solo dígitos, máx 10)
  onPhoneInput(): void {
    this.viewPhone = (this.viewPhone || '').replace(/\D+/g, '').slice(0, 10);
  }

  // Normaliza a formato API: +593 + sin 0 inicial
  private normalizePhoneForApi(view: string): string | null {
    const digits = (view || '').replace(/\D+/g, '');
    if (!digits) return null;
    const noZero = digits.startsWith('0') ? digits.slice(1) : digits;
    return `+593${noZero}`;
  }

  onSubmitPersonal(): void {
    if (this.personalForm.invalid) return;

    // Reusar lo que ya existía o defaults
    const L = this.lastInfo;

    const payload: InformationRequest = {
      province: this.selectedProvinciaId || null,
      canton:   this.selectedCantonId   || null,
      parish:   this.selectedParishId   || null,
      birthdate: this.viewBirthdate || null,
      phone_number: this.normalizePhoneForApi(this.viewPhone),

      // Campos obligatorios del tipo que no editas aquí:
      sexo: L?.sexo ?? this.DEFAULTS.sexo,
      estado_civil: L?.estado_civil ?? this.DEFAULTS.estado_civil,
      discapacidad: L?.discapacidad ?? this.DEFAULTS.discapacidad,
      discapacidad_permanente:
        L?.discapacidad_permanente ?? this.DEFAULTS.discapacidad_permanente,
      asistencia_establecimiento_discapacidad:
        L?.asistencia_establecimiento_discapacidad ??
        this.DEFAULTS.asistencia_establecimiento_discapacidad,
    };

    this.informationService.updateUserProfile(payload).subscribe({
      next: () => alert('✅ Información personal actualizada'),
      error: err => alert(err.message)
    });
  }

  // trackBy para listas
  trackById = (_: number, item: any) => item?.id ?? item;
}
