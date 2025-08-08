import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from 'express';
import { CourseService } from '../../../../../core/api/course/course.service';
import { CourseDetail, CourseDetailResponse, Difficulty } from '../../../../../core/api/course/course.interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-details',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit{
private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);

  // estado UI
  loading$ = this.courseService.loading$;
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  // datos
  course = signal<CourseDetail | null>(null);
  // Si tu backend expone un catálogo de dificultades, cámbialo por una llamada; por ahora, demo fija:
  difficulties = signal<Difficulty[]>([
    { id: 1, name: 'Fácil' },
    { id: 2, name: 'Intermedio' },
    { id: 3, name: 'Avanzado' },
  ]);

  // form
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    difficulty_id: [2, [Validators.required]],
    private: [false, [Validators.required]],
    enabled: [true, [Validators.required]]
  });

  // helpers
  isDirty = computed(() => this.form.dirty);
  canSave = computed(() => this.form.valid && this.form.dirty);

  ngOnInit(): void {
    /* const param = this.route.snapshot.paramMap.get('course');
    if (!param) {
      this.errorMsg.set('Parámetro de curso no encontrado en la ruta.');
      return;
    }
    this.loadCourse(param); */
  }

  private loadCourse(courseParam: string): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.courseService.getCourseDetail(courseParam).subscribe({
      next: (res: CourseDetailResponse) => {
        const c = res.course;
        this.course.set(c);
        this.form.reset({
          title: c.title,
          description: c.description,
          difficulty_id: c.difficulty_id,
          private: c.private,
          enabled: c.enabled
        }, { emitEvent: false });
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message || 'No se pudo cargar el curso.');
      }
    });
  }

  save(): void {
    const c = this.course();
    if (!c) return;

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMsg.set(null);
    this.successMsg.set(null);

    const payload = this.form.value as Partial<CourseDetail>;
    this.courseService.updateCourse(c.id, payload).subscribe({
      next: (res) => {
        this.successMsg.set('✔️ Cambios guardados correctamente');
        // Sincroniza estado local y limpia dirty
        const updated = res.course;
        this.course.set(updated);
        this.form.reset({
          title: updated.title,
          description: updated.description,
          difficulty_id: updated.difficulty_id,
          private: updated.private,
          enabled: updated.enabled
        }, { emitEvent: false });
        // Limpia el mensaje de éxito después de unos segundos
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message || 'Error al guardar los cambios.');
      }
    });
  }

  resetForm(): void {
    const c = this.course();
    if (!c) return;
    this.form.reset({
      title: c.title,
      description: c.description,
      difficulty_id: c.difficulty_id,
      private: c.private,
      enabled: c.enabled
    }, { emitEvent: false });
  }

  back(): void {
    this.router.navigate(['/studio/courses']); // ajusta tu ruta de retorno
  }
}
