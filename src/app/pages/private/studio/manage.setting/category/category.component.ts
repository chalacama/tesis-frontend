// src/app/manager/course/pages/category/category.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';

import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryAdmin,
  PaginationMeta
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

  // Datos (paginados desde la API adminIndex)
  categories: CategoryAdmin[] = [];
  meta: PaginationMeta | null = null;

  // Filtros y paginación
  searchTerm = '';
  currentPage = 1;
  perPage = 10; // puedes exponerlo en la vista si quieres cambiarlo

  // Diálogo de renombrar/crear
  renameDialogOpen = false;
  renameName = '';
  editingCategory: CategoryAdmin | null = null; // null => crear

  // Diálogo de eliminar
  deleteDialogOpen = false;
  deletingCategory: CategoryAdmin | null = null;

  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(UiToastService);

  ngOnInit(): void {
    this.loadCategories();
  }

  // ==========================
  //   Carga desde adminIndex
  // ==========================
  private loadCategories(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;

    const query = {
      search: this.searchTerm.trim() || undefined,
      page: this.currentPage,
      per_page: this.perPage
    };

    this.categoryService.getAdminList(query).subscribe({
      next: (res) => {
        this.categories = res.data ?? [];
        this.meta = res.meta;
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

  /**
   * Cuando cambia el término de búsqueda:
   * resetea a la página 1 y vuelve a pedir al backend.
   */
  applyFilter(): void {
    this.loadCategories(1);
  }

  /**
   * Navegación entre páginas (usa los datos de meta)
   */
  goToPage(page: number): void {
    if (!this.meta) return;
    if (page < 1 || page > this.meta.last_page || page === this.meta.current_page) return;
    this.loadCategories(page);
  }

  // ==========================
  //   Crear / Renombrar
  // ==========================
  openCreateDialog(): void {
    this.editingCategory = null;
    this.renameName = '';
    this.renameDialogOpen = true;
  }

  openRenameDialog(category: CategoryAdmin): void {
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
        next: () => {
          this.save = false;
          this.toast.add({
            severity: 'primary',
            summary: 'Creada',
            message: 'Categoría creada correctamente.'
          });
          this.closeRenameDialog();
          // Volver a cargar desde el backend (respeta filtros y página actual)
          this.loadCategories(this.currentPage);
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
      next: () => {
        this.save = false;
        this.toast.add({
          severity: 'primary',
          summary: 'Actualizada',
          message: 'Categoría renombrada correctamente.'
        });
        this.closeRenameDialog();
        // Reload para refrescar el orden alfabético y los conteos si cambian
        this.loadCategories(this.currentPage);
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
  openDeleteDialog(category: CategoryAdmin): void {
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

        // Elegimos la página a recargar:
        // Si era la única de la página y no estamos en la primera,
        // bajamos una página para evitar ver una página vacía.
        const nextPage =
          this.meta && this.categories.length === 1 && this.meta.current_page > 1
            ? this.meta.current_page - 1
            : this.meta?.current_page ?? 1;

        this.closeDeleteDialog();
        this.loadCategories(nextPage);
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
