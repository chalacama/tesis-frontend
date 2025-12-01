import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import {
  EduUnitAdmin,
  EduUnitAdminMeta,
  EduUnitPayload,
} from '../../../../../core/api/edu-unit/edu-unit.interface';
import { EduUnitService } from '../../../../../core/api/edu-unit/edu-unit.service';

import { EduLevel } from '../../../../../core/api/edu-level/edu-level.interface';
import { EduLevelService } from '../../../../../core/api/edu-level/edu-level.service';

import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-edu-unit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, LoadingBarComponent, ToastComponent],
  templateUrl: './edu-unit.component.html',
  styleUrl: './edu-unit.component.css',
})
export class EduUnitComponent implements OnInit {
  /** Barra de carga global para submits */
  save = false;

  /** Skeleton de la tabla */
  loadingTable = true;
  skeletonRows = Array.from({ length: 6 });

  /** Datos de la tabla (respuesta index-admin) */
  rows: EduUnitAdmin[] = [];
  meta: EduUnitAdminMeta | null = null;
  currentPage = 1;
  readonly perPage = 10;

  /** Niveles educativos para filtros y formularios */
  levels: EduLevel[] = [];
  loadingLevels = true;

  /** Formularios */
  filterForm!: FormGroup;
  unitForm!: FormGroup;

  /** Modal crear/editar */
  dialogMode: 'create' | 'edit' | null = null;
  selectedUnit: EduUnitAdmin | null = null;

  /** Modal eliminar */
  showDeleteDialog = false;
  deleteTarget: EduUnitAdmin | null = null;

  /** Estado derivado: filas filtradas por educational_level_ids en el frontend */
  readonly filteredUnits = computed(() => {
    const units = this.rows || [];
    const selected = (this.filterForm?.get('educational_level_ids')?.value ??
      []) as (string | number)[];

    if (!selected || selected.length === 0) {
      return units;
    }

    const ids = selected
      .map((v) => Number(v))
      .filter((v) => !Number.isNaN(v));

    if (ids.length === 0) return units;

    return units.filter((u) =>
      u.educational_levels.some((lvl) => ids.includes(lvl.id))
    );
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly eduUnitService: EduUnitService,
    private readonly eduLevelService: EduLevelService,
    private readonly toast: UiToastService
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadLevels();
    this.loadPage(1);
  }

  // ---------- Forms ----------

  private buildForms() {
    this.filterForm = this.fb.group({
      name: [''],
      organization_domain: [''],
      educational_level_ids: [[] as (string | number)[]], // solo para filtro (front)
    });

    this.unitForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      organization_domain: [''],
      url_logo: ['', [Validators.required]],
      educational_level_ids: [[], [Validators.required]],
    });
  }

  // ---------- Carga de datos ----------

  private loadLevels() {
    this.loadingLevels = true;
    this.eduLevelService.getAll().subscribe({
      next: (levels) => {
        this.levels = levels;
        this.loadingLevels = false;
      },
      error: (err) => {
        this.loadingLevels = false;
        const msg =
          err?.friendlyMessage ||
          'Error al obtener los niveles educativos. Intenta nuevamente.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg,
        });
      },
    });
  }

  loadPage(page: number) {
    this.loadingTable = true;
    this.currentPage = page;

    const { name, organization_domain } = this.filterForm.value;

    this.eduUnitService
      .getAdmin({
        page,
        per_page: this.perPage,
        name: name?.trim() || undefined,
        organization_domain: organization_domain?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.rows = res.data ?? [];
          this.meta = res.meta;
          this.loadingTable = false;
        },
        error: (err) => {
          this.loadingTable = false;
          const msg =
            err?.friendlyMessage ||
            'Error al obtener las unidades educativas. Intenta nuevamente.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg,
          });
        },
      });
  }

  // ---------- Filtros ----------

  applyFilters() {
    this.loadPage(1);
  }

  resetFilters() {
    this.filterForm.reset({
      name: '',
      organization_domain: '',
      educational_level_ids: [],
    });
    this.loadPage(1);
  }

  // ---------- Paginación ----------

  goToPrevPage() {
    if (!this.meta) return;
    if (this.meta.current_page <= 1) return;
    this.loadPage(this.meta.current_page - 1);
  }

  goToNextPage() {
    if (!this.meta) return;
    if (this.meta.current_page >= this.meta.last_page) return;
    this.loadPage(this.meta.current_page + 1);
  }

  // ---------- Modal Crear / Editar ----------

  openCreateDialog() {
    this.dialogMode = 'create';
    this.selectedUnit = null;

    this.unitForm.reset({
      name: '',
      organization_domain: '',
      url_logo: '',
      educational_level_ids: [],
    });
  }

  openEditDialog(unit: EduUnitAdmin) {
    this.dialogMode = 'edit';
    this.selectedUnit = unit;

    const levelIds = unit.educational_levels.map((lvl) => lvl.id.toString());

    this.unitForm.reset({
      name: unit.name,
      organization_domain: unit.organization_domain ?? '',
      url_logo: unit.url_logo ?? '',
      educational_level_ids: levelIds,
    });
  }

  closeUnitDialog() {
    this.dialogMode = null;
    this.selectedUnit = null;
    this.unitForm.reset();
  }

  submitUnit() {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      return;
    }

    const raw = this.unitForm.value;

    let selectedIds = (raw.educational_level_ids ??
      []) as (string | number)[];
    const educational_level_ids = selectedIds
      .map((v) => Number(v))
      .filter((v) => !Number.isNaN(v));

    if (!educational_level_ids.length) {
      this.unitForm.get('educational_level_ids')?.setErrors({ required: true });
      this.unitForm.get('educational_level_ids')?.markAsTouched();
      return;
    }

    const payload: EduUnitPayload = {
      name: raw.name!.trim(),
      url_logo: raw.url_logo!.trim(),
      organization_domain: raw.organization_domain?.trim() || null,
      educational_level_ids,
    };

    this.save = true;

    if (this.dialogMode === 'create') {
      this.eduUnitService.create(payload).subscribe({
        next: () => {
          this.save = false;
          this.toast.add({
            severity: 'primary',
            summary: 'Unidad creada',
            message: 'La unidad educativa se creó correctamente.',
          });
          this.closeUnitDialog();
          this.loadPage(this.currentPage);
        },
        error: (err) => {
          this.save = false;
          const msg =
            err?.friendlyMessage ||
            'Error al crear la unidad educativa. Intenta nuevamente.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg,
          });
        },
      });
    } else if (this.dialogMode === 'edit' && this.selectedUnit) {
      this.eduUnitService.update(this.selectedUnit.id, payload).subscribe({
        next: () => {
          this.save = false;
          this.toast.add({
            severity: 'primary',
            summary: 'Unidad actualizada',
            message: 'La unidad educativa se actualizó correctamente.',
          });
          this.closeUnitDialog();
          this.loadPage(this.currentPage);
        },
        error: (err) => {
          this.save = false;
          const msg =
            err?.friendlyMessage ||
            'Error al actualizar la unidad educativa. Intenta nuevamente.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg,
          });
        },
      });
    }
  }

  hasUnitError(controlName: string, error = 'required'): boolean {
    const ctrl = this.unitForm.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(error);
  }

  // ---------- Modal Eliminar ----------

  openDeleteDialog(unit: EduUnitAdmin) {
    this.deleteTarget = unit;
    this.showDeleteDialog = true;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;

    this.save = true;

    this.eduUnitService.delete(this.deleteTarget.id).subscribe({
      next: (res) => {
        this.save = false;
        this.showDeleteDialog = false;

        this.toast.add({
          severity: 'primary',
          summary: 'Unidad eliminada',
          message:
            res?.message || 'La unidad educativa se eliminó correctamente.',
        });

        this.deleteTarget = null;
        // Si la página actual se queda sin elementos, podríamos retroceder una página
        this.loadPage(
          this.meta && this.meta.current_page > 1 && this.rows.length === 1
            ? this.meta.current_page - 1
            : this.currentPage
        );
      },
      error: (err) => {
        this.save = false;
        this.showDeleteDialog = false;
        const msg =
          err?.friendlyMessage ||
          'Error al eliminar la unidad educativa. Intenta nuevamente.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg,
        });
      },
    });
  }

  // ---------- Util ----------

  trackById(index: number, item: EduUnitAdmin) {
    return item.id;
  }
}
