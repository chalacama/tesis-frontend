// pages/private/studio/manage.course/module/chapter/chap-detail/chap-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputLabelComponent } from '../../../../../../../shared/UI/components/form/input-label/input-label.component';
import { ButtonComponent } from '../../../../../../../shared/UI/components/button/button/button.component';
import { LoadingBarComponent } from '../../../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../../../../shared/UI/components/overlay/toast/toast.component';

import { ChapterService } from '../../../../../../../core/api/chapter/chapter.service';
import { Chapter } from '../../../../../../../core/api/chapter/chapter.interface';
import { UiToastService } from '../../../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-chap-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputLabelComponent,
    ButtonComponent,
    LoadingBarComponent,
    ToastComponent
  ],
  templateUrl: './chap-detail.component.html',
  styleUrl: './chap-detail.component.css'
})
export class ChapDetailComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly chapterSrv = inject(ChapterService);
  private readonly toast = inject(UiToastService);

  // estado
  loading = signal<boolean>(false);
  saving  = signal<boolean>(false);
  error   = signal<string | null>(null);

  // snapshot original para detectar cambios
  private originalDetails = signal<{ title: string; description: string | null } | null>(null);

  // Reactive form
  detailsForm = this.fb.group({
    title: this.fb.control<string>('', {
      validators: [Validators.required, Validators.maxLength(255)],
      nonNullable: true
    }),
    description: this.fb.control<string | null>(null),
  });

  // saber si hay cambios
  detailsHasChanges = computed(() => {
    const o = this.originalDetails();
    if (!o) return false;
    const v = this.detailsForm.getRawValue();
    return (o.title ?? '') !== (v.title ?? '') || (o.description ?? '') !== (v.description ?? '');
  });

  ngOnInit(): void {
    const chapterParam = this.getChapterParamFromRoute();
    if (!chapterParam) {
      this.error.set('No se recibió parámetro de capítulo en la ruta.');
      return;
    }

    this.fetchDetails(chapterParam);
  }

  // obtener el :chapter desde la ruta (por si está en padre/abuelo)
  private getChapterParamFromRoute(): string | null {
    return this.route.snapshot.paramMap.get('chapter')
      ?? this.route.parent?.snapshot.paramMap.get('chapter')
      ?? this.route.parent?.parent?.snapshot.paramMap.get('chapter')
      ?? null;
  }

  private fetchDetails(chapterId: string | number) {
    this.loading.set(true);
    this.error.set(null);

    this.chapterSrv.showChapter(chapterId).subscribe({
      next: (res) => {
        const ch = res.chapter as Chapter;

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
      description: this.detailsForm.value.description ?? null,
    };

    this.saving.set(true);
    this.chapterSrv.updateChapter(chapterId, payload).subscribe({
      next: (res) => {
        const ch = res.chapter;

        this.originalDetails.set({
          title: ch.title ?? '',
          description: ch.description ?? null,
        });

        this.detailsForm.reset({
          title: ch.title ?? '',
          description: ch.description ?? null,
        });

        this.saving.set(false);

        this.toast.add({
          severity: 'info',
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

