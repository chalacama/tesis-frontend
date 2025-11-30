import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FeedbackService } from '../../../../../core/api/feedback/feedback.service';
import { CourseBridge } from '../../../../../core/api/watching/course-bridge.service';
import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.css'
})
export class RatingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(FeedbackService);
  private readonly bridge = inject(CourseBridge);
  private readonly toast = inject(UiToastService);

  // estrellas disponibles
  readonly stars = [1, 2, 3, 4, 5];

  // estado
  readonly selectedStars = signal<number>(0);
  readonly hoverStars = signal<number | null>(null);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // para mostrar preview en hover
  readonly currentStars = computed<number>(() => {
    return this.hoverStars() ?? this.selectedStars();
  });

  // texto debajo de las estrellas
  readonly label = computed<string>(() => {
    const val = this.currentStars();
    if (!val) return 'Selecciona cuántas estrellas merece este curso.';

    switch (val) {
      case 1:
        return 'Muy malo · No lo recomendaría.';
      case 2:
        return 'Regular · Necesita mejorar en varios aspectos.';
      case 3:
        return 'Aceptable · Cumple, pero puede mejorar.';
      case 4:
        return 'Muy bueno · Me ha sido muy útil.';
      case 5:
        return 'Excelente · Lo recomendaría totalmente.';
      default:
        return '';
    }
  });

  constructor() {
    // Si ya hay un rating en memoria (puente #2), lo mostramos
    const summary = this.bridge.ratingSummary();
    if (summary?.user_stars) {
      this.selectedStars.set(summary.user_stars);
    }
  }

  // ---- helpers ----
  private get courseId(): string | null {
    // id del curso viene en la ruta /learning/course/:title/:id/...
    return (
      this.route.snapshot.paramMap.get('id') ??
      this.route.parent?.snapshot.paramMap.get('id') ??
      null
    );
  }

  // ---- eventos de UI ----
  onStarEnter(star: number) {
    this.hoverStars.set(star);
  }

  onStarLeave() {
    this.hoverStars.set(null);
  }

  onStarClick(star: number) {
    this.selectedStars.set(star);
    this.error.set(null);
  }

  reset() {
    this.selectedStars.set(0);
    this.hoverStars.set(null);
    this.error.set(null);
  }

  submit() {
    const stars = this.selectedStars();
    const courseId = this.courseId;

    if (!courseId) {
      this.error.set('No se pudo identificar el curso.');
      return;
    }

    if (!stars || stars < 1 || stars > 5) {
      this.error.set('Por favor, selecciona una calificación entre 1 y 5 estrellas.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.feedback.setRating(courseId, stars).subscribe({
      next: (res) => {
        this.saving.set(false);

        // Actualizar puente #2 para que DetailComponent refleje el cambio
        this.bridge.setRatingSummary({
          avg_stars: res.data.average_stars,
          count: res.data.ratings_count,
          user_stars: res.data.stars
        });

        // Toast de confirmación
        this.toast.add({
          severity: 'primary',
          summary: '⭐ ¡Gracias por tu valoración!',
          message: 'Tu opinión ayuda a mejorar la calidad de los cursos.',
          position: 'top-right',
          lifetime: 4000
        });
        // 👉 Pedir cerrar el diálogo al CourseComponent
        this.bridge.requestCloseRatingDialog();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(
          err?.error?.message || 'No se pudo guardar tu calificación. Intenta nuevamente.'
        );
      }
    });
  }
}

