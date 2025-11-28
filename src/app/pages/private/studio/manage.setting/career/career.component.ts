import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';

import { CareerService } from '../../../../../core/api/carrer/career.service';
import { Career, CareerPayload } from '../../../../../core/api/carrer/career.interface';
import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-career',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    LoadingBarComponent,
    ToastComponent
  ],
  templateUrl: './career.component.html',
  styleUrl: './career.component.css'
})
export class CareerComponent implements OnInit {

  // Barra de carga global (crear / actualizar / eliminar)
  save = false;

  // Skeleton de carga inicial
  isLoading = true;
  skeletonRows = Array.from({ length: 5 });

  // Datos
  careers: Career[] = [];
  filteredCareers: Career[] = [];

  // Búsqueda
  searchTerm = '';

  // Formulario (crear / editar)
  form!: FormGroup;
  selectedCareer: Career | null = null;

  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  deleteCareerTarget: Career | null = null;

  constructor(
    private readonly careerService: CareerService,
    private readonly fb: FormBuilder,
    private readonly toast: UiToastService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCareers();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      max_semesters: [1, [Validators.required, Validators.min(1)]],
      url_logo: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  private loadCareers(): void {
    this.isLoading = true;
    this.careerService.getAll().subscribe({
      next: (data) => {
        this.careers = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: err.message || 'Error al obtener las carreras.'
        });
      }
    });
  }

  // ====== BÚSQUEDA ======
  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredCareers = [...this.careers];
      return;
    }

    this.filteredCareers = this.careers.filter(c =>
      c.name.toLowerCase().includes(term)
    );
  }

  trackById(index: number, item: Career): number {
    return item.id;
  }

  // ====== CREAR / EDITAR ======
  openCreateModal(): void {
    this.selectedCareer = null;
    this.form.reset({
      name: '',
      max_semesters: 1,
      url_logo: ''
    });
    this.showCreateModal = true;
    this.showEditModal = false;
  }

  openEditModal(career: Career): void {
    this.selectedCareer = career;
    this.form.reset({
      name: career.name,
      max_semesters: career.max_semesters,
      url_logo: career.url_logo
    });
    this.showEditModal = true;
    this.showCreateModal = false;
  }

  closeCreateEditModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedCareer = null;
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CareerPayload = {
      name: this.form.value.name,
      max_semesters: Number(this.form.value.max_semesters),
      url_logo: this.form.value.url_logo
    };

    this.save = true;

    if (this.selectedCareer) {
      // actualizar
      this.careerService.update(this.selectedCareer.id, payload).subscribe({
        next: (updated) => {
          this.careers = this.careers.map(c =>
            c.id === updated.id ? updated : c
          );
          this.applyFilter();
          this.toast.add({
            severity: 'primary',
            summary: 'Actualizado',
            message: 'Carrera actualizada correctamente.'
          });
          this.save = false;
          this.closeCreateEditModal();
        },
        error: (err) => {
          this.save = false;
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: err?.error?.message || err.message || 'Error al actualizar la carrera.'
          });
        }
      });
    } else {
      // crear
      this.careerService.create(payload).subscribe({
        next: (created) => {
          this.careers = [...this.careers, created].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          this.applyFilter();
          this.toast.add({
            severity: 'primary',
            summary: 'Creado',
            message: 'Carrera creada correctamente.'
          });
          this.save = false;
          this.closeCreateEditModal();
        },
        error: (err) => {
          this.save = false;
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: err?.error?.message || err.message || 'Error al crear la carrera.'
          });
        }
      });
    }
  }

  // ====== ELIMINAR ======
  openDeleteModal(career: Career): void {
    this.deleteCareerTarget = career;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteCareerTarget = null;
  }

  confirmDelete(): void {
    if (!this.deleteCareerTarget) {
      return;
    }

    const id = this.deleteCareerTarget.id;
    this.save = true;

    this.careerService.delete(id).subscribe({
      next: (res) => {
        this.careers = this.careers.filter(c => c.id !== id);
        this.applyFilter();
        this.toast.add({
          severity: 'primary',
          summary: 'Eliminado',
          message: res?.message || 'Carrera eliminada correctamente.'
        });
        this.save = false;
        this.closeDeleteModal();
      },
      error: (err) => {
        this.save = false;
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: err?.error?.message || err.message || 'Error al eliminar la carrera.'
        });
      }
    });
  }
}

