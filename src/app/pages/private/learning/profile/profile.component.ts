import { Component, OnInit } from '@angular/core';
import { InformationService} from '../../../../core/api/profile/information.service';
import { UserInformation } from '../../../../core/api/profile/information.interface';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Canton, Parroquia, Provincia } from '../../../../core/services/provinces/provinces.interface';
import { ProvincesService } from '../../../../core/services/provinces/provinces.service';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { EducationalUser } from '../../../../core/api/profile/education.interface';
import { EducationService } from '../../../../core/api/profile/education.service';
import { AuthService } from '../../../../core/api/auth/auth.service';
import { User } from '../../../../core/api/auth/auth.interfaces';
import { CountryCode } from '../../../../core/services/code-country/code.country';
import { SedeService } from '../../../../core/api/sede/sede.service';
import { Sede } from '../../../../core/api/sede/sede.interface';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // Observables
  datosUsuario$!: Observable<User | null>;

  // Formularios
  personalForm!: FormGroup;
  educationalForm!: FormGroup;

  // Datos auxiliares
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  parroquias: Parroquia[] = [];
  sedes: Sede[] = [];

  selectedProvinciaId: string = '';
  selectedCantonId: string = '';
  selectedSedeId: number | null = null;

  countries: CountryCode = {
    name: 'Ecuador',
    code: 'EC',
    phoneCode: '+593',
    flagEmoji: '🇪🇨'
  };

  constructor(
    private fb: FormBuilder,
    private informationService: InformationService,
    private educationService: EducationService,
    private provincesService: ProvincesService,
    private sedeService: SedeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadCurrentUser();
    this.loadProvinces();
    this.loadSedes();
    this.loadUserInformation();
    this.loadEducationalInformation();
  }

  // --------------------------
  // Inicialización de formularios
  // --------------------------

  private initForms(): void {
    this.personalForm = this.fb.group({
      birthdate: [null],
      phone_number: [null, [Validators.maxLength(20)]],
      province: [null],
      canton: [null],
      parish: [null]
    });

    this.educationalForm = this.fb.group({
      sede_id: [null, Validators.required],
      career_id: [null],
      educational_level_id: [null],
      level: [null, [Validators.min(1)]]
    });
  }

  // --------------------------
  // Carga de datos iniciales
  // --------------------------

  private loadCurrentUser(): void {
    this.datosUsuario$ = this.authService.currentUser;
  }

  private loadProvinces(): void {
    this.provincesService.getProvincias().subscribe((prov) => {
      this.provincias = prov;
    });
  }

  private loadSedes(): void {
    this.sedeService.getSedes().subscribe((data) => {
      this.sedes = data;
    });
  }

  private loadUserInformation(): void {
    this.informationService.getUserProfile().subscribe((data) => {
      this.personalForm.patchValue(data);
      this.selectedProvinciaId = data.province;
      this.selectedCantonId = data.canton;
      this.updateCantones();
      this.updateParroquias();
    });
  }

  private loadEducationalInformation(): void {
    this.educationService.getEducationalProfile().subscribe((data) => {
      this.educationalForm.patchValue(data);
    });
  }

  // --------------------------
  // Actualización dinámica de combos
  // --------------------------

  onProvinciaChange(): void {
    this.updateCantones();
    this.selectedCantonId = '';
    this.parroquias = [];
  }

  onCantonChange(): void {
    this.updateParroquias();
  }

  private updateCantones(): void {
    const provincia = this.provincias.find(p => p.id === this.selectedProvinciaId);
    this.cantones = provincia?.cantones || [];
  }

  private updateParroquias(): void {
    const canton = this.cantones.find(c => c.id === this.selectedCantonId);
    this.parroquias = canton?.parroquias || [];
  }

  // --------------------------
  // Submits
  // --------------------------

  onSubmitPersonal(): void {
    if (this.personalForm.invalid) return;

    this.informationService.updateUserProfile(this.personalForm.value).subscribe({
      next: () => alert('✅ Información personal actualizada'),
      error: err => alert(err.message)
    });
  }

  onSubmitEducational(): void {
    if (this.educationalForm.invalid) return;

    this.educationService.updateEducationalProfile(this.educationalForm.value).subscribe({
      next: () => alert('✅ Información educativa actualizada'),
      error: err => alert(err.message)
    });
  }
}
