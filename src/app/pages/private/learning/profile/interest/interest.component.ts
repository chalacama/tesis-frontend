import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import { UiToastService } from '../../../../../shared/services/ui-toast.service';

import { InterestService } from '../../../../../core/api/profile/interest.service';
import {
  InterestCategory,
  InterestResponse,
  InterestUpdateRequest
} from '../../../../../core/api/profile/interest.interface';

import { CategoryService } from '../../../../../core/api/category/category.service';
import { Category } from '../../../../../core/api/category/category.interface';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-interest',
  standalone: true,
  imports: [CommonModule, IconComponent, ToastComponent, LoadingBarComponent],
  templateUrl: './interest.component.html',
  styleUrl: './interest.component.css'
})
export class InterestComponent implements OnInit {

  // Barra de carga al guardar
  save = false;

  // Carga inicial (skeletor)
  loading = true;

  // Error general
  globalError: string | null = null;

  // Modo edición
  editing = false;

  // Modal de confirmación
  confirmVisible = false;

  // Todas las categorías disponibles
  allCategories: Category[] = [];

  // Categorías seleccionadas por el usuario (solo IDs)
  selectedCategoryIds: number[] = [];

  // Copia para revertir en cancelar
  originalSelectedCategoryIds: number[] = [];

  // Máximo de categorías permitidas
  readonly maxSelectable = 4;

  // Skeleton
  skeletonRows = [1, 2, 3, 4];

  constructor(
    private interestService: InterestService,
    private categoryService: CategoryService,
    private toast: UiToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ---------------------------------------------------------
  // Carga inicial
  // ---------------------------------------------------------

  private loadData(): void {
    this.loading = true;
    this.globalError = null;

    forkJoin({
      categories: this.categoryService.getAll(),
      interests: this.interestService.show()
    }).subscribe({
      next: ({ categories, interests }) => {
        this.allCategories = categories ?? [];

        const data = (interests as InterestResponse)?.data;
        const userCats: InterestCategory[] = data?.categories ?? [];

        this.selectedCategoryIds = userCats.map(c => c.id);
        this.originalSelectedCategoryIds = [...this.selectedCategoryIds];

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.globalError = 'No se pudo cargar la información de intereses.';
      }
    });
  }

  // ---------------------------------------------------------
  // Helpers de vista
  // ---------------------------------------------------------

  get hasInterests(): boolean {
    return this.selectedCategoryIds.length > 0;
  }

  get selectedCategories(): Category[] {
    return this.allCategories.filter(cat =>
      this.selectedCategoryIds.includes(cat.id)
    );
  }

  isSelected(id: number): boolean {
    return this.selectedCategoryIds.includes(id);
  }

  // ---------------------------------------------------------
  // Modo edición
  // ---------------------------------------------------------

  onEdit(): void {
    this.editing = true;
    this.originalSelectedCategoryIds = [...this.selectedCategoryIds];
  }

  onCancel(): void {
    this.editing = false;
    this.selectedCategoryIds = [...this.originalSelectedCategoryIds];
  }

  toggleCategory(id: number): void {
    if (!this.editing) return;

    if (this.isSelected(id)) {
      // Quitar selección
      this.selectedCategoryIds = this.selectedCategoryIds.filter(cId => cId !== id);
      return;
    }

    // Si no está seleccionado y ya tenemos el máximo
    if (this.selectedCategoryIds.length >= this.maxSelectable) {
      this.toast.add({
        severity: 'warn',
        summary: 'Límite alcanzado',
        message: `Solo puedes seleccionar hasta ${this.maxSelectable} intereses.`
      });
      return;
    }

    this.selectedCategoryIds = [...this.selectedCategoryIds, id];
  }

  // ---------------------------------------------------------
  // Guardar + confirmación
  // ---------------------------------------------------------

  onSaveClick(): void {
    if (this.selectedCategoryIds.length !== this.maxSelectable) {
      this.toast.add({
        severity: 'warn',
        summary: 'Selecciona tus intereses',
        message: `Debes elegir exactamente ${this.maxSelectable} categorías.`
      });
      return;
    }

    this.confirmVisible = true;
  }

  onConfirmUpdate(): void {
    this.confirmVisible = false;
    this.save = true;
    this.globalError = null;

    const payload: InterestUpdateRequest = {
      categories: this.selectedCategoryIds
    };

    this.interestService.update(payload).subscribe({
      next: (res) => {
        this.save = false;

        if (!res.ok) {
          this.globalError = res.message || 'No se pudieron actualizar tus intereses.';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: this.globalError
          });
          return;
        }

        this.editing = false;
        this.originalSelectedCategoryIds = [...this.selectedCategoryIds];

        this.toast.add({
          severity: 'primary',
          summary: 'Guardado',
          message: 'Tus intereses se han actualizado correctamente.'
        });
      },
      error: () => {
        this.save = false;
        this.globalError = 'Ocurrió un error al actualizar tus intereses.';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: this.globalError
        });
      }
    });
  }
}

