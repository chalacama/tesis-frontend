// src/app/manager/course/pages/category/category.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';

import {
  Category,
  CategoryCreateDto,
  CategoryUpdateDto
} from '../../../../../core/api/category/category.interface';
import { CategoryService } from '../../../../../core/api/category/category.service';
import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    LoadingBarComponent,
    ToastComponent
  ],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent implements OnInit {

  // Barra de carga global (para crear/renombrar/eliminar)
  save = false;

  // Carga inicial
  loading = true;
  skeletonRows = Array.from({ length: 5 });

  // Datos
  categories: Category[] = [];
  filteredCategories: Category[] = [];

  // Búsqueda
  searchTerm = '';

  // Diálogo de renombrar/crear
  renameDialogOpen = false;
  renameName = '';
  editingCategory: Category | null = null; // null => crear

  // Diálogo de eliminar
  deleteDialogOpen = false;
  deletingCategory: Category | null = null;

  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(UiToastService);

  ngOnInit(): void {
    this.loadCategories();
  }

  // ==========================
  //   Carga y filtrado
  // ==========================
  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err?.friendlyMessage || 'Error al obtener la lista de categorías';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg
        });
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredCategories = [...this.categories];
      return;
    }
    this.filteredCategories = this.categories.filter((cat) =>
      cat.name.toLowerCase().includes(term)
    );
  }

  // ==========================
  //   Crear / Renombrar
  // ==========================
  openCreateDialog(): void {
    this.editingCategory = null;
    this.renameName = '';
    this.renameDialogOpen = true;
  }

  openRenameDialog(category: Category): void {
    this.editingCategory = category;
    this.renameName = category.name;
    this.renameDialogOpen = true;
  }

  closeRenameDialog(): void {
    this.renameDialogOpen = false;
    this.renameName = '';
    this.editingCategory = null;
  }

  saveRename(): void {
    const name = this.renameName.trim();
    if (!name) {
      this.toast.add({
        severity: 'warn',
        summary: 'Nombre requerido',
        message: 'El nombre de la categoría no puede estar vacío.'
      });
      return;
    }

    this.save = true;

    // Crear
    if (!this.editingCategory) {
      const payload: CategoryCreateDto = { name };
      this.categoryService.create(payload).subscribe({
        next: (created) => {
          this.save = false;
          this.toast.add({
            severity: 'primary',
            summary: 'Creada',
            message: 'Categoría creada correctamente.'
          });
          this.categories = [created, ...this.categories];
          this.applyFilter();
          this.closeRenameDialog();
        },
        error: (err) => {
          this.save = false;
          const apiErrors = err?.error?.errors;
          const firstError =
            apiErrors?.name?.[0] ||
            err?.friendlyMessage ||
            'Error al crear la categoría';
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: firstError
          });
        }
      });
      return;
    }

    // Renombrar (update)
    const payload: CategoryUpdateDto = { name };
    this.categoryService.update(this.editingCategory.id, payload).subscribe({
      next: (updated) => {
        this.save = false;
        this.toast.add({
          severity: 'primary',
          summary: 'Actualizada',
          message: 'Categoría renombrada correctamente.'
        });
        const idx = this.categories.findIndex(
          (c) => c.id === updated.id
        );
        if (idx !== -1) {
          this.categories[idx] = updated;
        }
        this.applyFilter();
        this.closeRenameDialog();
      },
      error: (err) => {
        this.save = false;
        const apiErrors = err?.error?.errors;
        const firstError =
          apiErrors?.name?.[0] ||
          err?.friendlyMessage ||
          'Error al renombrar la categoría';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: firstError
        });
      }
    });
  }

  // ==========================
  //   Eliminar
  // ==========================
  openDeleteDialog(category: Category): void {
    this.deletingCategory = category;
    this.deleteDialogOpen = true;
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen = false;
    this.deletingCategory = null;
  }

  confirmDelete(): void {
    if (!this.deletingCategory) return;

    const id = this.deletingCategory.id;
    this.save = true;

    this.categoryService.delete(id).subscribe({
      next: (res) => {
        this.save = false;
        this.toast.add({
          severity: 'primary',
          summary: 'Eliminada',
          message: res?.message || 'Categoría eliminada correctamente.'
        });
        this.categories = this.categories.filter((c) => c.id !== id);
        this.applyFilter();
        this.closeDeleteDialog();
      },
      error: (err) => {
        this.save = false;
        const msg =
          err?.friendlyMessage || 'Error al eliminar la categoría';
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: msg
        });
      }
    });
  }
}

