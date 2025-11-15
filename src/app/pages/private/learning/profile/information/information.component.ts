import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProvincesService } from '../../../../../core/services/provinces/provinces.service';
import { Provincia, Canton, Parroquia } from '../../../../../core/services/provinces/provinces.interface';
import { InformationService } from '../../../../../core/api/profile/information.service';
import { CountryCode } from '../../../../../core/services/code-country/code.country';

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
      this.personalForm.patchValue(data);

      this.selectedProvinciaId = (data.province as any) || '';
      this.updateCantones();

      this.selectedCantonId = (data.canton as any) || '';
      this.updateParroquias();

      this.selectedParishId = (data.parish as any) || '';
    });
  }

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

  onSubmitPersonal(): void {
    if (this.personalForm.invalid) return;

    const payload = {
      ...this.personalForm.value,
      province: this.selectedProvinciaId || null,
      canton:   this.selectedCantonId   || null,
      parish:   this.selectedParishId   || null,
    };

    this.informationService.updateUserProfile(payload).subscribe({
      next: () => alert('✅ Información personal actualizada'),
      error: err => alert(err.message)
    });
  }
}
