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
import {
  CareerAdmin,
  CareerPayload,
  PaginationMeta
} from '../../../../../core/api/carrer/career.interface';
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

  // Datos (paginados desde index-admin)
  careers: CareerAdmin[] = [];
  meta: PaginationMeta | null = null;

  // Filtros
  searchTerm = '';              // filtro por name
  maxSemestersFilter: number | null = null; // filtro por max_semesters

  // Paginación
  currentPage = 1;
  perPage = 10;

  // Formulario (crear / editar)
  form!: FormGroup;
  selectedCareer: CareerAdmin | null = null;

  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  deleteCareerTarget: CareerAdmin | null = null;

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

  // ==========================
  //   Carga desde index-admin
  // ==========================
  private loadCareers(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;

    const nameTrim = this.searchTerm.trim();

    const query = {
      name: nameTrim || undefined,
      max_semesters: this.maxSemestersFilter ?? undefined,
      page: this.currentPage,
      per_page: this.perPage
    };

    this.careerService.getAdminList(query).subscribe({
      next: (res) => {
        this.careers = res.data ?? [];
        this.meta = res.meta;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        const msg =
          err?.friendlyMessage || 'Error al obtener las carreras.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg
        });
      }
    });
  }

  // ====== Filtros ======
  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.loadCareers(1);
  }

  onMaxSemestersChange(value: string): void {
    const v = value.trim();
    if (!v) {
      this.maxSemestersFilter = null;
    } else {
      const parsed = Number(v);
      this.maxSemestersFilter =
        !isNaN(parsed) && parsed >= 1 ? parsed : null;
    }
    this.loadCareers(1);
  }

  // ====== Paginación ======
  goToPage(page: number): void {
    if (!this.meta) return;
    if (page < 1 || page > this.meta.last_page || page === this.meta.current_page) return;
    this.loadCareers(page);
  }

  trackById(index: number, item: CareerAdmin): number {
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

  openEditModal(career: CareerAdmin): void {
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
        next: () => {
          this.toast.add({
            severity: 'primary',
            summary: 'Actualizado',
            message: 'Carrera actualizada correctamente.'
          });
          this.save = false;
          this.closeCreateEditModal();
          // recargar lista para respetar orden, filtros y conteos
          this.loadCareers(this.currentPage);
        },
        error: (err) => {
          this.save = false;
          const apiErrors = err?.error?.errors;
          const firstError =
            apiErrors?.name?.[0] ||
            apiErrors?.max_semesters?.[0] ||
            apiErrors?.url_logo?.[0] ||
            err?.friendlyMessage ||
            'Error al actualizar la carrera.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: firstError
          });
        }
      });
    } else {
      // crear
      this.careerService.create(payload).subscribe({
        next: () => {
          this.toast.add({
            severity: 'primary',
            summary: 'Creado',
            message: 'Carrera creada correctamente.'
          });
          this.save = false;
          this.closeCreateEditModal();
          // recargar lista (desde la página actual)
          this.loadCareers(this.currentPage);
        },
        error: (err) => {
          this.save = false;
          const apiErrors = err?.error?.errors;
          const firstError =
            apiErrors?.name?.[0] ||
            apiErrors?.max_semesters?.[0] ||
            apiErrors?.url_logo?.[0] ||
            err?.friendlyMessage ||
            'Error al crear la carrera.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: firstError
          });
        }
      });
    }
  }

  // ====== ELIMINAR ======
  openDeleteModal(career: CareerAdmin): void {
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
        this.toast.add({
          severity: 'primary',
          summary: 'Eliminado',
          message: res?.message || 'Carrera eliminada correctamente.'
        });
        this.save = false;

        // Si era la única fila de la página y no estamos en la primera,
        // retrocedemos una página para evitar una página vacía.
        const nextPage =
          this.meta && this.careers.length === 1 && this.meta.current_page > 1
            ? this.meta.current_page - 1
            : this.meta?.current_page ?? 1;

        this.closeDeleteModal();
        this.loadCareers(nextPage);
      },
      error: (err) => {
        this.save = false;
        const msg =
          err?.friendlyMessage || 'Error al eliminar la carrera.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg
        });
      }
    });
  }
}
