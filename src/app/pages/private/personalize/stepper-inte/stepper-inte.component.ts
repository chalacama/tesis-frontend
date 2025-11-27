import {
  Component,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { LoadingBarComponent } from '../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import { Category } from '../../../../core/api/category/category.interface';
import { CategoryService } from '../../../../core/api/category/category.service';

import {
  InterestData,
  InterestUpdateRequest,
  InterestResponse
} from '../../../../core/api/profile/interest.interface';
import { InterestService } from '../../../../core/api/profile/interest.service';

import { AuthService } from '../../../../core/api/auth/auth.service';

import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-stepper-inte',
  standalone: true,
  imports: [CommonModule, LoadingBarComponent],
  templateUrl: './stepper-inte.component.html',
  styleUrl: './stepper-inte.component.css'
})
export class StepperInteComponent implements OnInit {

  // Barra de guardado
  saving = signal(false);

  // Skeleton de carga inicial
  isLoading = signal(true);
  skeletonRows = Array.from({ length: 3 }).map((_, i) => i);

  // Categorías disponibles
  categories: Category[] = [];

  // IDs seleccionados
  selectedCategoryIds: number[] = [];

  // Límite de selección
  readonly maxSelections = 4;

  // Mensaje de error UI
  errorMessage: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private interestService: InterestService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ------------------------
  // Carga inicial (categorías + intereses previos)
  // ------------------------
  private loadInitialData(): void {
    this.isLoading.set(true);

    const categories$ = this.categoryService.getAll().pipe(
      catchError(err => {
        console.error('Error cargando categorías:', err);
        return of([] as Category[]);
      })
    );

    const interests$ = this.interestService.show().pipe(
      catchError(err => {
        console.warn('No hay intereses previos o hubo error:', err);
        return of(null as InterestResponse | null);
      })
    );

    forkJoin({
      categories: categories$,
      interests: interests$
    }).subscribe({
      next: ({ categories, interests }) => {
        this.categories = categories ?? [];

        if (interests?.data?.categories?.length) {
          this.selectedCategoryIds = interests.data.categories.map(c => c.id);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando datos de intereses', error);
        this.isLoading.set(false);
      }
    });
  }

  // ------------------------
  // Chips: seleccionar / deseleccionar
  // ------------------------
  toggleCategory(category: Category): void {
    this.errorMessage = null; // limpiamos mensaje previo

    const id = category.id;
    const alreadySelected = this.selectedCategoryIds.includes(id);

    if (alreadySelected) {
      // Quitar selección
      this.selectedCategoryIds = this.selectedCategoryIds.filter(cId => cId !== id);
      return;
    }

    // Si aún no está seleccionada
    if (this.selectedCategoryIds.length >= this.maxSelections) {
      this.errorMessage = `Solo puedes seleccionar ${this.maxSelections} categorías.`;
      return;
    }

    this.selectedCategoryIds = [...this.selectedCategoryIds, id];
  }

  isSelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  // ------------------------
  // Guardar intereses
  // ------------------------
  onSubmitInterests(): void {
    this.errorMessage = null;

    if (this.selectedCategoryIds.length !== this.maxSelections) {
      this.errorMessage = `Selecciona exactamente ${this.maxSelections} categorías para continuar.`;
      return;
    }

    const payload: InterestUpdateRequest = {
      categories: this.selectedCategoryIds
    };

    this.saving.set(true);
    this.interestService.update(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        console.log('Intereses actualizados', res);

        // Marcar flag en el usuario actual
        this.authService.updateCurrentUser({
          has_user_category_interest: true
        });

        // Aquí ya terminaste el stepper, redirige donde quieras
        this.router.navigate(['/learning']);
      },
      error: (error) => {
        this.saving.set(false);
        console.error('Error al actualizar intereses', error);
        this.errorMessage = error.message || 'No se pudieron guardar tus intereses.';
      }
    });
  }
}
