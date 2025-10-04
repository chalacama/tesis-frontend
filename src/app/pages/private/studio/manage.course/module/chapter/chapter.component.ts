// pages/course/.../chapter/chapter.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { TestComponent } from './test/test.component';
import { ContentLearningComponent } from './content-learning/content-learning.component';
import { ButtonComponent } from '../../../../../../shared/UI/components/button/button/button.component';
import { InputLabelComponent } from '../../../../../../shared/UI/components/form/input-label/input-label.component';
import { ChapterService } from '../../../../../../core/api/chapter/chapter.service';
import { Chapter } from '../../../../../../core/api/chapter/chapter.interface';
import { LoadingBarComponent } from '../../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../../../shared/UI/components/overlay/toast/toast.component';
import { UiToastService } from '../../../../../../shared/services/ui-toast.service';



type TabKey = 'details' | 'content' | 'test';

@Component({
  selector: 'app-chapter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TestComponent,
    ContentLearningComponent,
    ButtonComponent,
    InputLabelComponent,
    LoadingBarComponent,
    ToastComponent
  ],
  templateUrl: './chapter.component.html',
  styleUrl: './chapter.component.css'
})
export class ChapterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chapterSrv = inject(ChapterService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(UiToastService);

  // pestaña seleccionada
  selected = signal<TabKey>('details');

  tabs = [
    { key: 'details' as const, label: 'Detalles' },
    { key: 'content'  as const, label: 'Contenido' },
    { key: 'test'     as const, label: 'Test' },
  ];

  // estado
  loading = signal<boolean>(false);
  saving  = signal<boolean>(false);
  error   = signal<string | null>(null);

  // datos originales para reset/hasChanges
  private originalDetails = signal<{ title: string; description: string | null } | null>(null);

  // Reactive form para Detalles
  detailsForm = this.fb.group({
    title: this.fb.control<string>('', { validators: [Validators.required, Validators.maxLength(255)], nonNullable: true }),
    description: this.fb.control<string | null>(null),
  });

  // utilidades ruta
  private getChapterParamFromRoute(): string | null {
    return this.route.snapshot.paramMap.get('chapter')
        ?? this.route.parent?.snapshot.paramMap.get('chapter')
        ?? null;
  }

  // habilitar/deshabilitar botones según si hubo cambios
  detailsHasChanges = computed(() => {
    const o = this.originalDetails();
    if (!o) return false;
    const v = this.detailsForm.getRawValue();
    return (o.title ?? '') !== (v.title ?? '') || (o.description ?? '') !== (v.description ?? '');
  });

  isTabDisabled = (_: TabKey) => this.loading() || this.saving(); // si quieres desactivar tabs durante carga/guardado
  isActive = (tab: TabKey) => this.selected() === tab;
  selectTab(tab: TabKey) { if (!this.isTabDisabled(tab)) this.selected.set(tab); }

  // carga inicial (solo lo necesario para Detalles)
  ngOnInit(): void {
    const chapterParam = this.getChapterParamFromRoute();
    if (!chapterParam) {
      this.error.set('No se recibió parámetro de capítulo en la ruta.');
      return;
    }

    this.fetchDetails(chapterParam);
  }

  private fetchDetails(chapterId: string | number) {
    this.loading.set(true);
    this.error.set(null);

    this.chapterSrv.show(chapterId).subscribe({
      next: (res) => {
        const ch = res.chapter as Chapter;
        // set form + snapshot original
        this.detailsForm.reset({
          title: ch.title ?? '',
          description: ch.description ?? null,
        });
        this.originalDetails.set({
          title: ch.title ?? '',
          description: ch.description ?? null,
        });

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo cargar el capítulo.');
        this.loading.set(false);
      }
    });
  }

  resetDetails() {
    const o = this.originalDetails();
    if (!o) return;
    this.detailsForm.reset({
      title: o.title ?? '',
      description: o.description ?? null,
    });
  }

  saveDetails() {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    const chapterId = this.getChapterParamFromRoute();
    if (!chapterId) return;

    const payload = {
      title: this.detailsForm.value.title!.trim(),
      description: (this.detailsForm.value.description ?? null),
    };

    this.saving.set(true);
    this.chapterSrv.update(chapterId, payload).subscribe({
      next: (res) => {
        const ch = res.chapter;
        // sincronizar original tras guardar
        this.originalDetails.set({
          title: ch.title ?? '',
          description: ch.description ?? null,
        });
        // normalizar el form con lo que devolvió el backend
        this.detailsForm.reset({
          title: ch.title ?? '',
          description: ch.description ?? null,
        });
        this.saving.set(false);
        this.toast.add({
    severity: 'info', // o 'primary' si quieres diferenciar "éxito"
    summary: 'Cambios guardados',
    message: 'El capítulo se guardó correctamente.',
    position: 'top-right',
    lifetime: 2500
  });
      },
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo guardar el capítulo.');
        this.saving.set(false);
      }
    });
  }
}
