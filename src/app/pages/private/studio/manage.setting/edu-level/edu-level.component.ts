import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';

import {
  EduLevelAdmin,
  EduLevelAdminMeta,
  EduLevelPayload,
} from '../../../../../core/api/edu-level/edu-level.interface';
import { EduLevelService } from '../../../../../core/api/edu-level/edu-level.service';

import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-edu-level',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, LoadingBarComponent, ToastComponent],
  templateUrl: './edu-level.component.html',
  styleUrl: './edu-level.component.css',
})
export class EduLevelComponent implements OnInit {
  /** Barra de carga global para store/update/delete */
  save = false;

  /** Skeleton de tabla */
  loadingTable = true;
  skeletonRows = Array.from({ length: 6 });

  /** Datos */
  rows: EduLevelAdmin[] = [];
  meta: EduLevelAdminMeta | null = null;
  currentPage = 1;
  readonly perPage = 10;

  /** Formularios */
  filterForm!: FormGroup;
  levelForm!: FormGroup;

  /** Modales */
  dialogMode: 'create' | 'edit' | null = null;
  selectedLevel: EduLevelAdmin | null = null;

  showDeleteDialog = false;
  deleteTarget: EduLevelAdmin | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly eduLevelService: EduLevelService,
    private readonly toast: UiToastService
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadPage(1);
  }

  // --------- Forms ---------

  private buildForms() {
    this.filterForm = this.fb.group({
      name: [''],
      period: [''],
      max_periods: [''],
    });

    this.levelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      period: ['', [Validators.required]],
      max_periods: [1, [Validators.required, Validators.min(1)]],
    });
  }

  // --------- Carga de datos ---------

  loadPage(page: number) {
    this.loadingTable = true;
    this.currentPage = page;

    const { name, period, max_periods } = this.filterForm.value;

    let maxPeriodsNumber: number | undefined;
    if (max_periods !== null && max_periods !== undefined && max_periods !== '') {
      const parsed = Number(max_periods);
      if (!Number.isNaN(parsed)) {
        maxPeriodsNumber = parsed;
      }
    }

    this.eduLevelService
      .getAdmin({
        page,
        per_page: this.perPage,
        name: name?.trim() || undefined,
        period: period?.trim() || undefined,
        max_periods: maxPeriodsNumber,
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
            'Error al obtener los niveles educativos. Intenta nuevamente.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg,
          });
        },
      });
  }

  // --------- Filtros ---------

  applyFilters() {
    this.loadPage(1);
  }

  resetFilters() {
    this.filterForm.reset({
      name: '',
      period: '',
      max_periods: '',
    });
    this.loadPage(1);
  }

  // --------- Paginación ---------

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

  // --------- Crear / Editar ---------

  openCreateDialog() {
    this.dialogMode = 'create';
    this.selectedLevel = null;
    this.levelForm.reset({
      name: '',
      description: '',
      period: '',
      max_periods: 1,
    });
  }

  openEditDialog(level: EduLevelAdmin) {
    this.dialogMode = 'edit';
    this.selectedLevel = level;

    this.levelForm.reset({
      name: level.name,
      description: level.description ?? '',
      period: level.period,
      max_periods: level.max_periods,
    });
  }

  closeLevelDialog() {
    this.dialogMode = null;
    this.selectedLevel = null;
    this.levelForm.reset();
  }

  submitLevel() {
    if (this.levelForm.invalid) {
      this.levelForm.markAllAsTouched();
      return;
    }

    const raw = this.levelForm.value;

    const payload: EduLevelPayload = {
      name: raw.name!.trim(),
      description: raw.description?.trim() || null,
      period: raw.period!.trim(),
      max_periods: Number(raw.max_periods),
    };

    if (Number.isNaN(payload.max_periods) || payload.max_periods < 1) {
      this.levelForm.get('max_periods')?.setErrors({ min: true });
      this.levelForm.get('max_periods')?.markAsTouched();
      return;
    }

    this.save = true;

    if (this.dialogMode === 'create') {
      this.eduLevelService.create(payload).subscribe({
        next: () => {
          this.save = false;
          this.toast.add({
            severity: 'primary',
            summary: 'Nivel creado',
            message: 'El nivel educativo se creó correctamente.',
          });
          this.closeLevelDialog();
          this.loadPage(this.currentPage);
        },
        error: (err) => {
          this.save = false;
          const msg =
            err?.friendlyMessage ||
            'Error al crear el nivel educativo. Intenta nuevamente.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg,
          });
        },
      });
    } else if (this.dialogMode === 'edit' && this.selectedLevel) {
      this.eduLevelService.update(this.selectedLevel.id, payload).subscribe({
        next: () => {
          this.save = false;
          this.toast.add({
            severity: 'primary',
            summary: 'Nivel actualizado',
            message: 'El nivel educativo se actualizó correctamente.',
          });
          this.closeLevelDialog();
          this.loadPage(this.currentPage);
        },
        error: (err) => {
          this.save = false;
          const msg =
            err?.friendlyMessage ||
            'Error al actualizar el nivel educativo. Intenta nuevamente.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: msg,
          });
        },
      });
    }
  }

  hasLevelError(controlName: string, error: string = 'required'): boolean {
    const ctrl = this.levelForm.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(error);
  }

  // --------- Eliminar ---------

  openDeleteDialog(level: EduLevelAdmin) {
    this.deleteTarget = level;
    this.showDeleteDialog = true;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;

    this.save = true;

    this.eduLevelService.delete(this.deleteTarget.id).subscribe({
      next: (res) => {
        this.save = false;
        this.showDeleteDialog = false;
        this.toast.add({
          severity: 'primary',
          summary: 'Nivel eliminado',
          message:
            res?.message || 'El nivel educativo se eliminó correctamente.',
        });
        const nextPage =
          this.meta && this.meta.current_page > 1 && this.rows.length === 1
            ? this.meta.current_page - 1
            : this.currentPage;
        this.deleteTarget = null;
        this.loadPage(nextPage);
      },
      error: (err) => {
        this.save = false;
        this.showDeleteDialog = false;
        const msg =
          err?.friendlyMessage ||
          'Error al eliminar el nivel educativo. Intenta nuevamente.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg,
        });
      },
    });
  }

  // --------- Util ---------

  trackById(index: number, item: EduLevelAdmin) {
    return item.id;
  }
}

