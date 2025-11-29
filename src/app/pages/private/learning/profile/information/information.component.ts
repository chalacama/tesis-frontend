import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import {
  InformationService,
} from '../../../../../core/api/profile/information.service';
import {
  InformationRequest,
  UserInformation,
} from '../../../../../core/api/profile/information.interface';

import {
  LocationService,
} from '../../../../../core/api/location/location.service';
import {
  LocationItem,
} from '../../../../../core/api/location/location.interfaces';

@Component({
  selector: 'app-information',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, ToastComponent, LoadingBarComponent],
  templateUrl: './information.component.html',
  styleUrl: './information.component.css'
})
export class InformationComponent implements OnInit {

  // Barra de carga al guardar
  save = false;

  // Carga inicial (skeletor)
  loading = true;

  // Modo edición / vista
  isEditing = false;

  // Modal de confirmación
  confirmVisible = false;

  // Datos actuales del backend
  info: UserInformation | null = null;

  // Formulario reactivo
  form!: FormGroup;

  // Combos de ubicación
  provinces: LocationItem[] = [];
  cantons: LocationItem[] = [];
  parishes: LocationItem[] = [];

  // Filas ficticias para el skeleton
  skeletonRows = [1, 2, 3];

  constructor(
    private fb: FormBuilder,
    private informationService: InformationService,
    private locationService: LocationService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.handleDiscapacidadChanges();
    this.loadProvinces();
    this.loadInformation();
  }

  // =======================
  //   FORM & VALIDATORS
  // =======================

  private buildForm(): void {
    this.form = this.fb.group({
      birthdate: ['', Validators.required],
      phone_local: ['', [Validators.required, this.ecPhoneValidator()]],

      // estos controls van a guardar IDs como STRING
      province_id: [null, Validators.required],
      canton_id: [null, Validators.required],
      parish_id: [null, Validators.required],

      sexo: [null, Validators.required],
      estado_civil: [null, Validators.required],
      discapacidad: ['no', Validators.required],
      discapacidad_permanente: [null],
      asistencia_establecimiento_discapacidad: [null],
    });
  }

  private handleDiscapacidadChanges(): void {
    this.form.get('discapacidad')?.valueChanges.subscribe((value: 'si' | 'no') => {
      const discPermCtrl = this.form.get('discapacidad_permanente');
      const asistCtrl = this.form.get('asistencia_establecimiento_discapacidad');

      if (!discPermCtrl || !asistCtrl) return;

      if (value === 'si') {
        discPermCtrl.setValidators([Validators.required]);
        asistCtrl.setValidators([Validators.required]);
      } else {
        discPermCtrl.clearValidators();
        asistCtrl.clearValidators();
        discPermCtrl.setValue(null);
        asistCtrl.setValue(null);
      }

      discPermCtrl.updateValueAndValidity();
      asistCtrl.updateValueAndValidity();
    });
  }

  // Validador de teléfono local ecuatoriano: 10 dígitos, empieza en 0
  private ecPhoneValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const raw = (control.value || '').toString();
      const digits = raw.replace(/\D/g, '');

      if (!digits) return { ecPhone: true };

      // 10 dígitos, empezando en 0 (ej: 0963856048)
      if (digits.length !== 10 || !digits.startsWith('0')) {
        return { ecPhone: true };
      }

      return null;
    };
  }

  get phoneLocalControl(): AbstractControl | null {
    return this.form.get('phone_local');
  }

  // Se ejecuta en (input) para mantener el formato 096 385 6048
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10); // máx 10 dígitos
    const formatted = this.formatLocalPhone(digits);

    this.form.patchValue(
      { phone_local: formatted },
      { emitEvent: false }
    );
  }

  private formatLocalPhone(digits: string): string {
    if (!digits) return '';

    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 10);

    if (digits.length <= 3) return part1;
    if (digits.length <= 6) return `${part1} ${part2}`;
    return `${part1} ${part2} ${part3}`;
  }

  private backendPhoneToLocalFormatted(phone: string | null): string {
    if (!phone) return '';

    // ejemplo: +593963856048
    const match = phone.match(/^\+593(\d{9})$/);
    if (!match) return '';

    const withoutPrefix = match[1]; // '963856048'
    const local = '0' + withoutPrefix; // '0963856048'
    return this.formatLocalPhone(local);
  }

  private localToBackendPhone(localFormatted: string): string {
    const digits = localFormatted.replace(/\D/g, '');
    if (digits.length !== 10 || !digits.startsWith('0')) {
      return '';
    }
    const withoutZero = digits.slice(1);
    return `+593${withoutZero}`;
  }

  // =======================
  //   CARGA DE UBICACIONES
  // =======================

  private loadProvinces(): void {
    this.locationService.getProvinces().subscribe({
      next: (provinces) => {
        this.provinces = provinces;
      },
      error: () => {
        this.provinces = [];
      },
    });
  }

  onProvinceChange(): void {
    const provinceId = this.form.get('province_id')?.value;
    if (!provinceId) {
      this.cantons = [];
      this.parishes = [];
      this.form.patchValue({
        canton_id: null,
        parish_id: null,
      });
      return;
    }

    this.locationService.getCantons(provinceId).subscribe({
      next: (cantons) => {
        this.cantons = cantons;
        this.parishes = [];
        this.form.patchValue({
          canton_id: null,
          parish_id: null,
        });
      },
      error: () => {
        this.cantons = [];
        this.parishes = [];
      },
    });
  }

  onCantonChange(): void {
    const provinceId = this.form.get('province_id')?.value;
    const cantonId = this.form.get('canton_id')?.value;

    if (!provinceId || !cantonId) {
      this.parishes = [];
      this.form.patchValue({
        parish_id: null,
      });
      return;
    }

    this.locationService.getParishes(provinceId, cantonId).subscribe({
      next: (parishes) => {
        this.parishes = parishes;
        this.form.patchValue({
          parish_id: null,
        });
      },
      error: () => {
        this.parishes = [];
      },
    });
  }

  // =======================
  //   CARGA DE INFORMACIÓN
  // =======================

  private loadInformation(): void {
    this.loading = true;

    this.informationService.show().subscribe({
      next: (res) => {
        this.info = res.userInformation;
        if (this.info) {
          this.patchFormFromInfo(this.info);
        }
        this.loading = false;
      },
      error: () => {
        this.info = null;
        this.loading = false;
      },
    });
  }

  private patchFormFromInfo(info: UserInformation): void {
    // Convertimos IDs a string para que coincidan con los <option> del select
    const provinceId = info.province_id != null ? String(info.province_id) : null;
    const cantonId = info.canton_id != null ? String(info.canton_id) : null;
    const parishId = info.parish_id != null ? String(info.parish_id) : null;

    this.form.patchValue(
      {
        birthdate: info.birthdate,
        phone_local: this.backendPhoneToLocalFormatted(info.phone_number),
        province_id: provinceId,
        canton_id: cantonId,
        parish_id: parishId,
        sexo: info.sexo,
        estado_civil: info.estado_civil,
        discapacidad: info.discapacidad,
        discapacidad_permanente: info.discapacidad_permanente,
        asistencia_establecimiento_discapacidad:
          info.asistencia_establecimiento_discapacidad,
      },
      { emitEvent: false }
    );

    // Cargar combos dependientes (cantones y parroquias)
    if (info.province_id) {
      this.locationService.getCantons(info.province_id).subscribe({
        next: (cantons) => {
          this.cantons = cantons;

          this.form.patchValue(
            { canton_id: cantonId },
            { emitEvent: false }
          );

          if (info.canton_id) {
            this.locationService
              .getParishes(info.province_id, info.canton_id)
              .subscribe({
                next: (parishes) => {
                  this.parishes = parishes;
                  this.form.patchValue(
                    { parish_id: parishId },
                    { emitEvent: false }
                  );
                },
              });
          }
        },
      });
    }

    // Esta es la "línea mágica" para que el boton Guardar esté deshabilitado
    // mientras no haya cambios:
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // =======================
  //   MODO VISTA / EDICIÓN
  // =======================

  enterEditMode(): void {
    this.isEditing = true;

    if (!this.info) {
      this.form.reset({ discapacidad: 'no' });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    } else {
      this.patchFormFromInfo(this.info);
    }
  }

  cancelEdit(): void {
    this.confirmVisible = false;
    this.isEditing = false;

    if (this.info) {
      this.patchFormFromInfo(this.info);
    } else {
      this.form.reset({ discapacidad: 'no' });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  // =======================
  //   GUARDAR (CONFIRMACIÓN)
  // =======================

  // Getter para el botón Guardar
  get canSave(): boolean {
    // válido, no guardando y con cambios (form.dirty = !form.pristine)
    return this.form.valid && !this.save && this.form.dirty;
  }

  openConfirm(): void {
    if (this.form.invalid || !this.form.dirty) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmVisible = true;
  }

  cancelConfirm(): void {
    this.confirmVisible = false;
  }

  confirmSave(): void {
    this.confirmVisible = false;
    this.doSave();
  }

  private doSave(): void {
    if (this.form.invalid || !this.form.dirty) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    const payload: InformationRequest = {
      birthdate: value.birthdate,
      phone_number: this.localToBackendPhone(value.phone_local),
      // aquí convertimos STRING → number para el backend
      province_id: Number(value.province_id),
      canton_id: Number(value.canton_id),
      parish_id: Number(value.parish_id),
      sexo: value.sexo,
      estado_civil: value.estado_civil,
      discapacidad: value.discapacidad,
      discapacidad_permanente:
        value.discapacidad === 'si'
          ? value.discapacidad_permanente ?? null
          : null,
      asistencia_establecimiento_discapacidad:
        value.discapacidad === 'si'
          ? value.asistencia_establecimiento_discapacidad ?? null
          : null,
    };

    this.save = true;

    this.informationService.update(payload).subscribe({
      next: (res) => {
        this.save = false;
        this.info = res.userInformation;
        this.isEditing = false;
        this.patchFormFromInfo(res.userInformation);
        // aquí podrías disparar un toast con res.message
      },
      error: () => {
        this.save = false;
        // aquí podrías disparar un toast de error
      },
    });
  }
}
