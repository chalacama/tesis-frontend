import {
  Component,
  OnInit,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { LoadingBarComponent } from '../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import {
  InformationRequest,
  UserInformation
} from '../../../../core/api/profile/information.interface';
import { InformationService } from '../../../../core/api/profile/information.service';

import { CountryCode } from '../../../../core/services/code-country/code.country';

import { UserService } from '../../../../core/api/profile/user.service';
import { AuthService } from '../../../../core/api/auth/auth.service';
import { User } from '../../../../core/api/auth/auth.interfaces';

import { forkJoin, of, catchError } from 'rxjs';

import { LocationService } from '../../../../core/api/location/location.service';
import { LocationItem } from '../../../../core/api/location/location.interfaces';

import { PersonalizeComponent } from '../personalize.component';

@Component({
  selector: 'app-stepper-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingBarComponent],
  templateUrl: './stepper-info.component.html',
  styleUrl: './stepper-info.component.css'
})
export class StepperInfoComponent implements OnInit {

  // Loader barra superior
  saving = signal(false);

  // Skeleton de carga inicial
  isLoading = signal(true);
  skeletonRows = Array.from({ length: 8 }).map((_, i) => i);

  // Formularios
  infoForm!: FormGroup;
  usernameForm!: FormGroup;

  // Datos auxiliares de ubicación (nuevo servicio)
  provinces: LocationItem[] = [];
  cantons: LocationItem[] = [];
  parishes: LocationItem[] = [];

  // Fijo a Ecuador 🇪🇨
  selectedCountryCode: CountryCode = {
    name: 'Ecuador',
    code: 'EC',
    phoneCode: '+593',
    flagEmoji: '🇪🇨'
  };

  // Control de errores UI username
  usernameError: string | null = null;
  usernameAvailable: boolean | null = null;

  // Usuario actual
  currentUser: User | null = null;
  canUpdateUsername = false;
  currentUsername = '';

  // Opciones estáticas
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

  constructor(
    private fb: FormBuilder,
    private informationService: InformationService,
    private locationService: LocationService,
    private userService: UserService,
    private authService: AuthService,
    private personalize: PersonalizeComponent
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.handleDiscapacidadChanges();
    this.loadInitialData();
  }

  // ------------------------
  // Construcción de formularios
  // ------------------------
  private buildForms(): void {
    this.infoForm = this.fb.group({
      birthdate: ['', Validators.required],
      phone_local: ['', [Validators.required, this.ecPhoneValidator()]],

      // IDs de ubicación (string en el form, number al enviar)
      province_id: [null, Validators.required],
      canton_id: [null, Validators.required],
      parish_id: [null, Validators.required],

      sexo: [null, Validators.required],
      estado_civil: [null, Validators.required],
      discapacidad: ['no', Validators.required],
      discapacidad_permanente: [null],
      asistencia_establecimiento_discapacidad: [null],
    });

    this.currentUser = this.authService.getCurrentUser();
    this.canUpdateUsername = !!this.currentUser?.can_update_username;
    this.currentUsername = this.currentUser?.username ?? '';

    this.usernameForm = this.fb.group({
      username: [
        this.currentUsername,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-z0-9._-]+$/),
        ],
      ],
    });
  }

  private handleDiscapacidadChanges(): void {
    const discCtrl = this.infoForm.get('discapacidad');
    const discPermCtrl = this.infoForm.get('discapacidad_permanente');
    const asistCtrl = this.infoForm.get('asistencia_establecimiento_discapacidad');

    discCtrl?.valueChanges.subscribe((value: 'si' | 'no') => {
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

  // ------------------------
  // Carga inicial (skeleton)
  // ------------------------
  private loadInitialData(): void {
    this.isLoading.set(true);

    const provinces$ = this.locationService.getProvinces();
    const userInfo$ = this.informationService.show().pipe(
      catchError(err => {
        console.warn('No hay información previa de usuario o hubo error:', err);
        return of(null);
      })
    );

    forkJoin({
      provinces: provinces$,
      userInfo: userInfo$,
    }).subscribe({
      next: ({ provinces, userInfo }) => {
        this.provinces = provinces;

        const info: UserInformation | null =
          userInfo && userInfo.userInformation ? userInfo.userInformation : null;

        this.fillInfoForm(info);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando datos iniciales', error);
        this.isLoading.set(false);
      },
    });
  }

  private fillInfoForm(info: UserInformation | null): void {
    if (!info) return;

    // Fecha al formato YYYY-MM-DD para el input date
    const birthdate = this.toDateInput(info.birthdate);

    // Teléfono local formateado 096 385 6048
    const phoneLocal = this.backendPhoneToLocalFormatted(info.phone_number);

    // IDs como string en el formulario
    const provinceId = info.province_id != null ? String(info.province_id) : null;
    const cantonId = info.canton_id != null ? String(info.canton_id) : null;
    const parishId = info.parish_id != null ? String(info.parish_id) : null;

    this.infoForm.patchValue(
      {
        birthdate,
        phone_local: phoneLocal,
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

    // Cargar combos dependientes
    if (info.province_id) {
      this.locationService.getCantons(info.province_id).subscribe({
        next: (cantons) => {
          this.cantons = cantons;

          this.infoForm.patchValue(
            { canton_id: cantonId },
            { emitEvent: false }
          );

          if (info.canton_id) {
            this.locationService
              .getParishes(info.province_id, info.canton_id)
              .subscribe({
                next: (parishes) => {
                  this.parishes = parishes;
                  this.infoForm.patchValue(
                    { parish_id: parishId },
                    { emitEvent: false }
                  );
                },
              });
          }
        },
      });
    }
  }

  // ------------------------
  // Selects dependientes ubicación
  // ------------------------
  onProvinceChange(): void {
    const provinceId = this.infoForm.get('province_id')?.value;

    if (!provinceId) {
      this.cantons = [];
      this.parishes = [];
      this.infoForm.patchValue({
        canton_id: null,
        parish_id: null,
      });
      return;
    }

    this.locationService.getCantons(provinceId).subscribe({
      next: (cantons) => {
        this.cantons = cantons;
        this.parishes = [];
        this.infoForm.patchValue({
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
    const provinceId = this.infoForm.get('province_id')?.value;
    const cantonId = this.infoForm.get('canton_id')?.value;

    if (!provinceId || !cantonId) {
      this.parishes = [];
      this.infoForm.patchValue({
        parish_id: null,
      });
      return;
    }

    this.locationService.getParishes(provinceId, cantonId).subscribe({
      next: (parishes) => {
        this.parishes = parishes;
        this.infoForm.patchValue({
          parish_id: null,
        });
      },
      error: () => {
        this.parishes = [];
      },
    });
  }

  // ------------------------
  // Submit información personal
  // ------------------------
  onSubmitInfo(): void {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    const value = this.infoForm.value;

    const payload: InformationRequest = {
      birthdate: value.birthdate,
      phone_number: this.localToBackendPhone(value.phone_local),

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

    this.saving.set(true);

    this.informationService.update(payload).subscribe({
      next: (res) => {
        this.saving.set(false);

        // marcar flag en el usuario actual (para el stepper padre)
        this.authService.updateCurrentUser({
          has_user_information: true,
        });

        // avisar al componente padre que el paso "info" se completó
        this.personalize.onStepCompleted('info');
      },
      error: (error) => {
        this.saving.set(false);
        console.error('Error al actualizar información', error);
      },
    });
  }

  // ------------------------
  // Username: validar y actualizar
  // ------------------------
  onValidateUsername(): void {
    this.usernameError = null;
    this.usernameAvailable = null;

    if (!this.canUpdateUsername) {
      return;
    }

    if (this.usernameForm.invalid) {
      this.usernameError = 'El username no cumple el formato requerido.';
      return;
    }

    const desired = this.usernameForm.value.username?.trim();
    if (!desired || desired === this.currentUsername) {
      return;
    }

    this.userService.validateUsername({ username: desired }).subscribe({
      next: (res) => {
        this.usernameAvailable = res.is_available;
        if (!res.is_available) {
          this.usernameError =
            res.message || 'El nombre de usuario no está disponible.';
        }
      },
      error: (err) => {
        this.usernameAvailable = null;
        this.usernameError =
          err.message || 'No se pudo validar el username.';
      },
    });
  }

  onSubmitUsername(): void {
    if (!this.canUpdateUsername) return;

    this.usernameError = null;

    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.usernameError = 'Revisa el username.';
      return;
    }

    const desired = this.usernameForm.value.username?.trim();
    if (!desired || desired === this.currentUsername) {
      this.usernameError = 'Ingresa un username diferente al actual.';
      return;
    }

    if (this.usernameAvailable === false) {
      this.usernameError = 'El username no está disponible.';
      return;
    }

    this.saving.set(true);
    this.userService.updateUsername({ username: desired }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.currentUsername = res.username;
        this.canUpdateUsername = false;
        this.usernameAvailable = null;
      },
      error: (err) => {
        this.saving.set(false);
        this.usernameError =
          err.message || 'No se pudo actualizar el username.';
      },
    });
  }

  // ------------------------
  // Helpers fecha y teléfono
  // ------------------------
  private toDateInput(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    return this.infoForm.get('phone_local');
  }

  // formatea mientras el usuario escribe → 096 385 6048
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10); // máx 10 dígitos
    const formatted = this.formatLocalPhone(digits);

    this.infoForm.patchValue(
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

    // ejemplo esperado: +593963856048
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
}
