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
import { EduUnit } from '../../../../../core/api/edu-unit/edu-unit.interface';
import { EduUnitService } from '../../../../../core/api/edu-unit/edu-unit.service';

import {
  SedeWithUsersCount,
  SedePaginatedResponse,
  SedeAllFilters,
  SedePayload
} from '../../../../../core/api/sede/sede.interface';
import { SedeService } from '../../../../../core/api/sede/sede.service';

import { Career } from '../../../../../core/api/carrer/career.interface';
import { CareerService } from '../../../../../core/api/carrer/career.service';

import { EduLevel } from '../../../../../core/api/edu-level/edu-level.interface';
import { EduLevelService } from '../../../../../core/api/edu-level/edu-level.service';

import {
  LocationItem
} from '../../../../../core/api/location/location.interfaces';
import { LocationService } from '../../../../../core/api/location/location.service';

import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-sede',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    LoadingBarComponent,
    ToastComponent
  ],
  templateUrl: './sede.component.html',
  styleUrl: './sede.component.css'
})
export class SedeComponent implements OnInit {
  // Barra de carga global (creates / updates / deletes)
  save = false;

  // Skeleton tabla
  isTableLoading = false;
  skeletonRows = Array.from({ length: 5 });

  // Datos tabla
  sedes: SedeWithUsersCount[] = [];
  currentPage = 1;
  perPage = 10;
  lastPage = 1;
  totalItems = 0;

  // Unidades educativas para el select
  eduUnits: EduUnit[] = [];

  // Filtros
  filtersForm!: FormGroup;
  filterProvinces: LocationItem[] = [];
  filterCantons: LocationItem[] = [];
  eduLevels: EduLevel[] = [];

  // Datos auxiliares para formulario de sede
  formProvinces: LocationItem[] = [];
  formCantons: LocationItem[] = [];
  careers: Career[] = [];

  // Formulario crear / editar sede
  sedeForm!: FormGroup;
  isSedeModalOpen = false;
  isEditMode = false;
  editingSede: SedeWithUsersCount | null = null;

  // Modal eliminar
  isDeleteModalOpen = false;
  deletingSede: SedeWithUsersCount | null = null;

  // Filas expandidas
  expandedRows = new Set<number>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly sedeService: SedeService,
    private readonly careerService: CareerService,
    private readonly eduLevelService: EduLevelService,
    private readonly locationService: LocationService,
    private readonly toast: UiToastService,
    private readonly eduUnitService: EduUnitService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadAuxiliaryData();
    this.fetchSedes(true);
  }

  // ----------------------------------------
  // Inicialización formularios
  // ----------------------------------------
 private initForms(): void {
  this.filtersForm = this.fb.group({
    unitName: [''],
    provinceId: [null],
    cantonId: [null],
    educationalLevelId: [null]
  });

  // province_id y canton_id YA NO son obligatorios
  this.sedeForm = this.fb.group({
    province_id: [null],                                // sin Validators.required
    canton_id: [null],                                  // sin Validators.required
    educational_unit_id: [null, Validators.required],   // sigue siendo obligatorio
    career_ids: [[]] // opcional
  });

  // Cuando cambie la provincia en filtros, cargar cantones
  this.filtersForm.get('provinceId')?.valueChanges.subscribe((id) => {
    this.onFilterProvinceChange(id);
  });

  // Cuando cambie la provincia en el formulario, cargar cantones
  this.sedeForm.get('province_id')?.valueChanges.subscribe((id) => {
    this.onFormProvinceChange(id);
  });
}


  // ----------------------------------------
  // Cargar datos auxiliares (provincias, niveles, carreras)
  // ----------------------------------------
  private loadAuxiliaryData(): void {
  // Provincias para filtros y formulario
  this.locationService.getProvinces().subscribe({
    next: (provinces) => {
      this.filterProvinces = provinces;
      this.formProvinces = provinces;
    },
    error: () => {
      this.toast.add({
        severity: 'danger',
        summary: 'Ubicaciones',
        message: 'No se pudieron cargar las provincias.'
      });
    }
  });

  // Niveles educativos (para filtro educationalLevelId)
  this.eduLevelService.getAll().subscribe({
    next: (levels) => {
      this.eduLevels = levels;
    },
    error: () => {
      this.toast.add({
        severity: 'danger',
        summary: 'Niveles educativos',
        message: 'No se pudieron cargar los niveles educativos.'
      });
    }
  });

  // Todas las carreras (para seleccionar en el modal de sede)
  this.careerService.getAll().subscribe({
    next: (careers) => {
      this.careers = careers;
    },
    error: () => {
      this.toast.add({
        severity: 'danger',
        summary: 'Carreras',
        message: 'No se pudo cargar la lista de carreras.'
      });
    }
  });

  // 👇 NUEVO: todas las unidades educativas para el select
  this.eduUnitService.getAll().subscribe({
    next: (units) => {
      this.eduUnits = units;
    },
    error: () => {
      this.toast.add({
        severity: 'danger',
        summary: 'Unidades educativas',
        message: 'No se pudieron cargar las unidades educativas.'
      });
    }
  });
}


  // ----------------------------------------
  // Manejo de filtros
  // ----------------------------------------
  onApplyFilters(): void {
    this.fetchSedes(true);
  }

  onResetFilters(): void {
    this.filtersForm.reset({
      unitName: '',
      provinceId: null,
      cantonId: null,
      educationalLevelId: null
    });
    this.filterCantons = [];
    this.fetchSedes(true);
  }

  private onFilterProvinceChange(provinceId: number | null): void {
    this.filtersForm.patchValue({ cantonId: null }, { emitEvent: false });

    if (!provinceId) {
      this.filterCantons = [];
      return;
    }

    this.locationService.getCantons(provinceId).subscribe({
      next: (cantons) => {
        this.filterCantons = cantons;
      },
      error: () => {
        this.toast.add({
          severity: 'danger',
          summary: 'Cantones',
          message: 'No se pudieron cargar los cantones para el filtro.'
        });
      }
    });
  }

  private buildFilters(resetPage: boolean): SedeAllFilters {
    if (resetPage) {
      this.currentPage = 1;
    }

    const f = this.filtersForm.value;

    const filters: SedeAllFilters = {
      unitName: f.unitName?.trim() || undefined,
      provinceId: f.provinceId ?? null,
      cantonId: f.cantonId ?? null,
      educationalLevelId: f.educationalLevelId ?? null,
      page: this.currentPage,
      perPage: this.perPage
    };

    return filters;
  }

  // ----------------------------------------
  // Cargar sedes (index-admin)
  // ----------------------------------------
  fetchSedes(resetPage: boolean): void {
    const filters = this.buildFilters(resetPage);

    this.isTableLoading = true;
    this.sedeService.getAdminSedes(filters).subscribe({
      next: (res: SedePaginatedResponse) => {
        this.sedes = res.data ?? [];
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.perPage = res.per_page;
        this.totalItems = res.total;
        this.isTableLoading = false;
      },
      error: (err) => {
        this.isTableLoading = false;
        const msg =
          err?.message ||
          'No se pudieron cargar las sedes. Intenta nuevamente.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg
        });
      }
    });
  }

  // ----------------------------------------
  // Paginación
  // ----------------------------------------
  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.fetchSedes(false);
  }

  changePerPage(perPage: number): void {
    this.perPage = perPage;
    this.fetchSedes(true);
  }

  // ----------------------------------------
  // Expand / collapse filas
  // ----------------------------------------
  isExpanded(id: number): boolean {
    return this.expandedRows.has(id);
  }

  toggleExpand(id: number): void {
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }

  // ----------------------------------------
  // Modal crear / editar sede
  // ----------------------------------------
  openCreateModal(): void {
    this.isEditMode = false;
    this.editingSede = null;
    this.formCantons = [];
    this.sedeForm.reset({
      province_id: null,
      canton_id: null,
      educational_unit_id: null,
      career_ids: []
    });
    this.isSedeModalOpen = true;
  }

  openEditModal(sede: SedeWithUsersCount): void {
    this.isEditMode = true;
    this.editingSede = sede;

    // Cargar cantones de la provincia de la sede para el formulario
    this.formCantons = [];
    const provinceId = sede.province_id;
    if (provinceId) {
      this.locationService.getCantons(provinceId).subscribe({
        next: (cantons) => {
          this.formCantons = cantons;
        },
        error: () => {
          this.toast.add({
            severity: 'danger',
            summary: 'Cantones',
            message: 'No se pudieron cargar los cantones de la sede.'
          });
        }
      });
    }

    this.sedeForm.reset({
    province_id: sede.province_id,
    canton_id: sede.canton_id,
    educational_unit_id: sede.educational_unit?.id ?? null,
    career_ids: sede.careers?.map((c) => c.id) ?? []
  });


    this.isSedeModalOpen = true;
  }

  closeSedeModal(): void {
    this.isSedeModalOpen = false;
    this.sedeForm.markAsPristine();
  }

  private onFormProvinceChange(provinceId: number | null): void {
    this.sedeForm.patchValue({ canton_id: null }, { emitEvent: false });

    if (!provinceId) {
      this.formCantons = [];
      return;
    }

    this.locationService.getCantons(provinceId).subscribe({
      next: (cantons) => {
        this.formCantons = cantons;
      },
      error: () => {
        this.toast.add({
          severity: 'danger',
          summary: 'Cantones',
          message: 'No se pudieron cargar los cantones.'
        });
      }
    });
  }

  onSubmitSedeForm(): void {
    if (this.sedeForm.invalid) {
      this.sedeForm.markAllAsTouched();
      return;
    }

    const raw = this.sedeForm.value;
    const payload: SedePayload = {
      province_id: raw.province_id,
      canton_id: raw.canton_id,
      educational_unit_id: raw.educational_unit_id,
      career_ids: raw.career_ids && raw.career_ids.length ? raw.career_ids : []
    };

    this.save = true;

    if (this.isEditMode && this.editingSede) {
      this.sedeService.updateSede(this.editingSede.id, payload).subscribe({
        next: (updated) => {
          this.save = false;
          // Reemplazar en la lista
          this.sedes = this.sedes.map((s) =>
            s.id === updated.id ? updated : s
          );
          this.toast.add({
            severity: 'primary',
            summary: 'Actualizada',
            message: 'La sede se actualizó correctamente.'
          });
          this.closeSedeModal();
        },
        error: (err) => {
          this.save = false;
          const msg =
            err?.message ||
            err?.friendlyMessage ||
            'No se pudo actualizar la sede.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg
          });
        }
      });
    } else {
      this.sedeService.createSede(payload).subscribe({
        next: (created) => {
          this.save = false;
          // Opcional: recargar tabla completa, pero aquí la agregamos arriba
          this.sedes = [created, ...this.sedes];
          this.totalItems += 1;
          this.toast.add({
            severity: 'primary',
            summary: 'Creada',
            message: 'La sede se creó correctamente.'
          });
          this.closeSedeModal();
        },
        error: (err) => {
          this.save = false;
          const msg =
            err?.message ||
            err?.friendlyMessage ||
            'No se pudo crear la sede.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg
          });
        }
      });
    }
  }

  // ----------------------------------------
  // Modal eliminar sede
  // ----------------------------------------
  openDeleteModal(sede: SedeWithUsersCount): void {
    this.deletingSede = sede;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletingSede = null;
  }

  confirmDelete(): void {
    if (!this.deletingSede) return;

    this.save = true;
    const id = this.deletingSede.id;

    this.sedeService.deleteSede(id).subscribe({
      next: () => {
        this.save = false;
        this.sedes = this.sedes.filter((s) => s.id !== id);
        this.totalItems = Math.max(0, this.totalItems - 1);
        this.toast.add({
          severity: 'primary',
          summary: 'Eliminada',
          message: 'La sede se eliminó correctamente.'
        });
        this.closeDeleteModal();
      },
      error: (err) => {
        this.save = false;
        const msg =
          err?.message ||
          err?.friendlyMessage ||
          'No se pudo eliminar la sede.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg
        });
      }
    });
  }
}
