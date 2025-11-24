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
  InformationRequest,
  UserInformation
} from '../../../../core/api/profile/information.interface';
import { InformationService } from '../../../../core/api/profile/information.service';

import {
  Provincia,
  Canton,
  Parroquia
} from '../../../../core/services/provinces/provinces.interface';
import { ProvincesService } from '../../../../core/services/provinces/provinces.service';

// Solo usamos la interfaz, ya no el servicio
import { CountryCode } from '../../../../core/services/code-country/code.country';

import { UserService } from '../../../../core/api/profile/user.service';
import { AuthService } from '../../../../core/api/auth/auth.service';
import { User } from '../../../../core/api/auth/auth.interfaces';

import { forkJoin, of, catchError } from 'rxjs';

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

  // Datos auxiliares
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  parroquias: Parroquia[] = [];

  // Fijo a Ecuador 🇪🇨
  selectedCountryCode: CountryCode = {
    name: 'Ecuador',
    code: 'EC',
    phoneCode: '+593',
    flagEmoji: '🇪🇨'
  };

  // Control de errores UI
  phoneError: string | null = null;
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
    private provincesService: ProvincesService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}


  ngOnInit(): void {
    this.buildForms();
    this.loadInitialData();
  }

  // ------------------------
  // Construcción de formularios
  // ------------------------
  private buildForms(): void {
    this.infoForm = this.fb.group({
      birthdate: ['', Validators.required],
      phone_local: ['', [Validators.required]],

      provinceId: ['', Validators.required],
      cantonId: ['', Validators.required],
      parishId: ['', Validators.required],

      sexo: ['', Validators.required],
      estado_civil: ['', Validators.required],
      discapacidad: ['', Validators.required],
      discapacidad_permanente: [''],
      asistencia_establecimiento_discapacidad: [''],
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
          Validators.pattern(/^[a-z0-9._]+$/),
        ],
      ],
    });

    // Si cambia "discapacidad" a "no", limpiamos campos dependientes
    this.infoForm.get('discapacidad')?.valueChanges.subscribe(value => {
      if (value === 'no') {
        this.infoForm.patchValue({
          discapacidad_permanente: null,
          asistencia_establecimiento_discapacidad: null
        });
      }
    });
  }

  // ------------------------
  // Carga inicial (skeleton)
  // ------------------------
    private loadInitialData(): void {
  this.isLoading.set(true);

  const provincias$ = this.provincesService.getProvincias();
  const userInfo$ = this.informationService.getUserProfile().pipe(
    catchError(err => {
      console.warn('No hay información previa de usuario o hubo error:', err);
      // Devolvemos null para que forkJoin no falle
      return of(null);
    })
  );

  forkJoin({
    provincias: provincias$,
    userInfo: userInfo$,
  }).subscribe({
    next: ({ provincias, userInfo }) => {
      this.provincias = provincias;

      // Solo llenamos el formulario si hay datos
      this.fillInfoForm(userInfo);

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

    // Fecha a formato input[type="date"]
    const birthdate = this.toDateInput(info.birthdate);

    // Extraer parte local del teléfono (sin +593 y espacios)
    const phoneLocal = this.extractLocalPhone(info.phone_number || '');

    // Preseleccionar provincia / cantón / parroquia por NOMBRE
    const prov = this.provincias.find(p => p.nombre === info.province);
    if (prov) {
      this.cantones = prov.cantones;
      const canton = prov.cantones.find(c => c.nombre === info.canton);
      if (canton) {
        this.parroquias = canton.parroquias;
      }

      this.infoForm.patchValue({
        provinceId: prov.id,
        cantonId: canton?.id ?? '',
        parishId:
          canton?.parroquias.find(parr => parr.nombre === info.parish)?.id ?? '',
      });
    }

    this.infoForm.patchValue({
      birthdate,
      phone_local: phoneLocal,
      sexo: info.sexo,
      estado_civil: info.estado_civil,
      discapacidad: info.discapacidad,
      discapacidad_permanente: info.discapacidad_permanente,
      asistencia_establecimiento_discapacidad: info.asistencia_establecimiento_discapacidad,
    });
  }

  // ------------------------
  // Selects dependientes ubicación
  // ------------------------
  onProvinceChange(): void {
    const provId = this.infoForm.value.provinceId;
    const prov = this.provincias.find(p => p.id === provId);

    this.cantones = prov?.cantones ?? [];
    this.parroquias = [];

    this.infoForm.patchValue({
      cantonId: '',
      parishId: '',
    });
  }

  onCantonChange(): void {
    const provId = this.infoForm.value.provinceId;
    const cantonId = this.infoForm.value.cantonId;

    const prov = this.provincias.find(p => p.id === provId);
    const canton = prov?.cantones.find(c => c.id === cantonId);

    this.parroquias = canton?.parroquias ?? [];

    this.infoForm.patchValue({
      parishId: '',
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

    const fullPhone = this.formatFullPhone();
    if (!fullPhone) {
      return; // phoneError ya seteado
    }

    const provinceName = this.getProvinceNameById(this.infoForm.value.provinceId);
    const cantonName = this.getCantonNameById(
      this.infoForm.value.provinceId,
      this.infoForm.value.cantonId
    );
    const parishName = this.getParishNameById(
      this.infoForm.value.provinceId,
      this.infoForm.value.cantonId,
      this.infoForm.value.parishId
    );

    const payload: InformationRequest = {
      birthdate: this.infoForm.value.birthdate,
      phone_number: fullPhone,
      province: provinceName,
      canton: cantonName,
      parish: parishName,
      sexo: this.infoForm.value.sexo,
      estado_civil: this.infoForm.value.estado_civil,
      discapacidad: this.infoForm.value.discapacidad,
      discapacidad_permanente:
        this.infoForm.value.discapacidad === 'si'
          ? this.infoForm.value.discapacidad_permanente
          : null,
      asistencia_establecimiento_discapacidad:
        this.infoForm.value.discapacidad === 'si'
          ? this.infoForm.value.asistencia_establecimiento_discapacidad
          : null,
    };

    this.saving.set(true);
    this.informationService.updateUserProfile(payload).subscribe({
      next: (updated: UserInformation) => {
        this.saving.set(false);
        console.log('Información actualizada', updated);

        // 🔹 Marcar flag en el usuario actual
        this.authService.updateCurrentUser({
          has_user_information: true
        });

        // 🔹 Avanzar automáticamente al siguiente paso (education)
        this.router.navigate(['/personalize/education'], {
          relativeTo: this.route
        });
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
          this.usernameError = res.message || 'El nombre de usuario no está disponible.';
        }
      },
      error: (err) => {
        this.usernameAvailable = null;
        this.usernameError = err.message || 'No se pudo validar el username.';
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
        this.canUpdateUsername = false; // ya no se puede volver a cambiar
        this.usernameAvailable = null;
      },
      error: (err) => {
        this.saving.set(false);
        this.usernameError = err.message || 'No se pudo actualizar el username.';
      },
    });
  }

  // ------------------------
  // Helpers
  // ------------------------
  private toDateInput(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}


    private extractLocalPhone(full: string): string {
    if (!full) return '';

    // Nos quedamos solo con dígitos
    let digits = full.replace(/\D/g, '');

    // Si viene con prefijo 593, lo quitamos
    if (digits.startsWith('593')) {
      digits = digits.slice(3);
    }

    // Si vienen 10 dígitos y empieza en 0 => quitamos el 0
    if (digits.length === 10 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }


    private formatFullPhone(): string | null {
    this.phoneError = null;

    const rawLocal = (this.infoForm.value.phone_local || '').toString();
    // Solo números
    let digits = rawLocal.replace(/\D/g, '');

    // 10 dígitos con 0 delante => quitamos el 0
    if (digits.length === 10 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    if (digits.length !== 9) {
      this.phoneError = 'Ingresa un número de 9 dígitos (por ejemplo: 991622884).';
      return null;
    }

    // Solo Ecuador +593
    if (this.selectedCountryCode.phoneCode !== '+593') {
      this.phoneError = 'Sólo se admite código +593 para Ecuador.';
      return null;
    }

    // Lo que mandamos al backend (sin espacios):
    // +593991622884 → cumple regex /^\+593[0-9]{9}$/
    return `+593${digits}`;
  }


  private getProvinceNameById(id: string): string {
    return this.provincias.find(p => p.id === id)?.nombre ?? '';
  }

  private getCantonNameById(provId: string, cantonId: string): string {
    const prov = this.provincias.find(p => p.id === provId);
    return prov?.cantones.find(c => c.id === cantonId)?.nombre ?? '';
  }

  private getParishNameById(provId: string, cantonId: string, parishId: string): string {
    const prov = this.provincias.find(p => p.id === provId);
    const canton = prov?.cantones.find(c => c.id === cantonId);
    return canton?.parroquias.find(pq => pq.id === parishId)?.nombre ?? '';
  }
    onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Solo dígitos
    let digits = input.value.replace(/\D/g, '');

    // Máximo 10 (por si ponen 0 + 9 dígitos)
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    let display = '';
    if (digits.length <= 2) {
      display = digits;
    } else if (digits.length <= 5) {
      display = `${digits.slice(0, 2)} ${digits.slice(2)}`;
    } else {
      display = `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }

    // Actualizamos el form sin disparar valueChanges
    this.infoForm.patchValue({ phone_local: display }, { emitEvent: false });
  }

}
