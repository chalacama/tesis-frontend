import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { debounceTime, firstValueFrom } from 'rxjs';

import { FileUploadComponent } from '../../../../../../../shared/UI/components/form/file-upload/file-upload.component';
import { ButtonComponent } from '../../../../../../../shared/UI/components/button/button/button.component';
import { IconComponent } from '../../../../../../../shared/UI/components/button/icon/icon.component';

import { ChapterService } from '../../../../../../../core/api/chapter/chapter.service';
import { TypeService } from '../../../../../../../core/api/type/type.service';
import { TypeLarningContentResponse } from '../../../../../../../core/api/type/type.interface';
import { LearingContentResponse } from '../../../../../../../core/api/chapter/chapter.interface';
import { LoadingBarComponent } from '../../../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

@Component({
  selector: 'app-content-learning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent, ButtonComponent, IconComponent, LoadingBarComponent],
  templateUrl: './content-learning.component.html',
  styleUrl: './content-learning.component.css'
})
export class ContentLearningComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly chapterSrv = inject(ChapterService);
  private readonly typeSrv = inject(TypeService);
  private readonly sanitizer = inject(DomSanitizer);

  loading = signal<boolean>(true);
  saving  = signal<boolean>(false);
  types   = signal<TypeLarningContentResponse[]>([]);
  current = signal<LearingContentResponse | null>(null);
  fileSel = signal<File | null>(null);
  loadbar = signal<boolean>(false);

  // ⬇️ url ahora acepta string | File | File[] | string[] | null
  form = this.fb.group({
    type_content_id: this.fb.control<number | null>(null, { validators: [Validators.required], nonNullable: true }),
    url: this.fb.control<string | File | File[] | string[] | null>(null),
  });

  /** Reactive → signals */
  selectedTypeId = signal<number | null>(this.form.controls.type_content_id.value);

  /** URL embebible (https://www.youtube.com/embed/VIDEOID) */
  private embedUrl = signal<string | null>(null);
  embedSafe = computed<SafeResourceUrl | null>(() => {
    const u = this.embedUrl();
    return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null;
  });

  /** IDs de tipo desde backend */
  typeIdYoutube = computed(() =>
    this.types().find(t => (t.name ?? '').toLowerCase() === 'youtube')?.id ?? null
  );
  typeIdArchivo = computed(() =>
    this.types().find(t => (t.name ?? '').toLowerCase() === 'archivo')?.id ?? null
  );

  /** Vista/estado */
  isYouTube = computed(() => this.selectedTypeId() === this.typeIdYoutube());
  isArchivo = computed(() => this.selectedTypeId() === this.typeIdArchivo());

  /** Para permitir guardar aun sin cambios (vacío) */
  private allowEmptySave = true;
  hasChanges = computed(() => this.allowEmptySave || (!this.loading() && (this.form.dirty || !!this.fileSel())));

  constructor() {
    /** Validadores dinámicos & preview de YouTube */
    effect(() => {
      const isYT = this.isYouTube();

      // Limpia validadores del control
      this.form.controls.url.clearValidators();

      // Si es YouTube: NO required, solo valida formato si hay texto (y si el valor es string)
      if (isYT) {
        this.form.controls.url.addValidators([this.youtubeUrlOptionalValidator.bind(this)]);
      } else {
        // Si pasa a Archivo, limpia el embed
        this.embedUrl.set(null);
      }
      this.form.controls.url.updateValueAndValidity({ emitEvent: false });
    });

    /** Sync selectedTypeId con el control */
    this.form.controls.type_content_id.valueChanges
      .pipe(debounceTime(0))
      .subscribe(v => this.selectedTypeId.set(v));

    /** Trimming + preview al escribir URL (solo si es string) */
    this.form.controls.url.valueChanges
      .pipe(debounceTime(200))
      .subscribe(v => {
        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (trimmed !== v) {
            this.form.controls.url.setValue(trimmed, { emitEvent: false });
          }
          this.updateEmbedFromUrl(trimmed);
        } else {
          // Si no es string (archivo/array), no hay preview de YouTube
          this.embedUrl.set(null);
        }
      });
  }

  ngOnInit(): void {
    this.init();
    this.formStatus();
  }

  sabed = true;

  formStatus() {
    this.form.statusChanges.subscribe(() => {
      this.sabed = this.form.pristine && !this.form.invalid;
      console.log(this.sabed);
    });
  }

  /** Acepta watch, youtu.be, shorts, embed, con parámetros extra */
  private extractYouTubeId(raw: string): string | null {
    if (!raw) return null;
    try {
      const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
      const url = new URL(normalized);

      const host = url.hostname.replace(/^www\./i, '').toLowerCase();
      const path = url.pathname;

      // 1) youtu.be/<id>
      if (host === 'youtu.be') {
        const id = path.split('/').filter(Boolean)[0];
        return this.isValidId(id) ? id : null;
      }

      // 2) youtube.com/watch?v=<id> | /shorts/<id> | /embed/<id>
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        const p = path.toLowerCase();

        const v = url.searchParams.get('v');
        if (p === '/watch' && v && this.isValidId(v)) return v;

        if (p.startsWith('/shorts/')) {
          const id = path.split('/').filter(Boolean)[1];
          return this.isValidId(id) ? id : null;
        }

        if (p.startsWith('/embed/')) {
          const id = path.split('/').filter(Boolean)[1];
          return this.isValidId(id) ? id : null;
        }
      }

      // 3) Fallback para *.youtube.com
      if (host.endsWith('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v && this.isValidId(v)) return v;

        const segs = path.split('/').filter(Boolean);
        if (segs[0] === 'shorts' || segs[0] === 'embed') {
          const id = segs[1];
          if (this.isValidId(id)) return id;
        }
      }

      // 4) Último recurso: regex
      const REG_FALLBACK = /(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
      const m = raw.match(REG_FALLBACK);
      if (m?.[1] && this.isValidId(m[1])) return m[1];

      return null;
    } catch {
      return null;
    }
  }

  private isValidId(id?: string | null): boolean {
    return !!id && /^[A-Za-z0-9_-]{6,}$/.test(id); // >=6 para contemplar variantes
  }

  private buildEmbedUrl(id: string): string {
    return `https://www.youtube.com/embed/${id}?rel=0`;
  }

  private updateEmbedFromUrl(url: string) {
    if (!this.isYouTube()) {
      this.embedUrl.set(null);
      return;
    }
    const id = this.extractYouTubeId(url);
    this.embedUrl.set(id ? this.buildEmbedUrl(id) : null);
  }

  /**
   * Validador opcional:
   * - Si el valor NO es string → válido (no aplica).
   * - Si es string vacío → válido.
   * - Si es string con texto → debe ser URL válida de YouTube (extraíble a videoId).
   */
  private youtubeUrlOptionalValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = ctrl.value;
    if (typeof v !== 'string') return null;   // no valida si no es string
    const value = v.trim();
    if (!value) return null;                  // vacío es VÁLIDO
    const id = this.extractYouTubeId(value);
    return id ? null : { youtubeUrl: true };
  }

  private getChapterParamFromRoute(): string | null {
    return this.route.snapshot.paramMap.get('chapter')
      ?? this.route.parent?.snapshot.paramMap.get('chapter')
      ?? null;
  }

  private async init() {
    try {
      this.loading.set(true);

      const list = await firstValueFrom(this.typeSrv.getTypeLearningContentAll());
      this.types.set(list);

      const chapterParam = this.getChapterParamFromRoute() ?? '';
      const lc = await firstValueFrom(this.chapterSrv.showLearningContent(chapterParam));
      this.current.set(lc);

      const name = lc.learning_content?.type_learning_content?.name?.toLowerCase() ?? null;

      const preTypeId =
        name === 'archivo' ? this.typeIdArchivo() :
        name === 'youtube' ? this.typeIdYoutube() : this.typeIdYoutube();

      // url desde backend (puede ser '' o una url real)
      const initialUrl = lc.learning_content?.url ?? '';

      this.form.patchValue({
        type_content_id: preTypeId,
        url: initialUrl
      }, { emitEvent: true });

      this.selectedTypeId.set(this.form.controls.type_content_id.value);
      this.updateEmbedFromUrl(initialUrl);

      this.form.markAsPristine();
      this.fileSel.set(null);
    } catch {
      const yt = this.types().find(t => (t.name ?? '').toLowerCase() === 'youtube');
      this.form.patchValue({ type_content_id: yt?.id ?? null, url: '' }, { emitEvent: true });
      this.selectedTypeId.set(this.form.controls.type_content_id.value);
      this.embedUrl.set(null);
      this.form.markAsPristine();
      this.fileSel.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  /** Acciones UI */
  pickYouTube() {
    const id = this.typeIdYoutube();
    if (!id) return;

    this.form.controls.type_content_id.setValue(id);
    this.selectedTypeId.set(id);

    // Limpia todo lo de archivo
    this.fileSel.set(null);
    this.form.controls.url.setValue('', { emitEvent: true }); // borra previews del file-upload
    this.embedUrl.set(null); // y el embed, hasta que escriban una URL
    this.form.markAsDirty();
  }

  pickArchivo() {
    const id = this.typeIdArchivo();
    if (!id) return;

    this.form.controls.type_content_id.setValue(id);
    this.selectedTypeId.set(id);

    // Limpia todo lo de youtube
    this.fileSel.set(null);
    this.form.controls.url.setValue(null, { emitEvent: true }); // ⚠️ ahora null para no dejar string
    this.embedUrl.set(null);
    this.form.markAsDirty();
  }

  onFileSelected(file: File | null) {
    this.fileSel.set(file);
    const id = this.typeIdArchivo();
    if (id) {
      this.form.controls.type_content_id.setValue(id);
      this.selectedTypeId.set(id);
      this.embedUrl.set(null);

      // Refleja en el control que ahora hay File[]
      this.form.controls.url.setValue(file ? [file] : null, { emitEvent: true });
    }
  }

  reset() {
  const lc = this.current();
  const name = lc?.learning_content?.type_learning_content?.name?.toLowerCase() ?? null;

  const typeBack =
    name === 'archivo' ? this.typeIdArchivo() :
    name === 'youtube' ? this.typeIdYoutube() : this.typeIdYoutube();

  const urlBack = lc?.learning_content?.url ?? '';

  // 👇 si hay url de backend, pásala para que el file-upload cree el preview desde URL
  const urlForForm = urlBack ? urlBack : null;

  this.form.reset({ type_content_id: typeBack, url: urlForForm });
  this.selectedTypeId.set(typeBack);
  this.updateEmbedFromUrl(urlBack);

  this.form.markAsPristine();
  this.fileSel.set(null);
  this.sabed = true;
}


  // Guardar con soporte YouTube/Archivo (prioriza File si existe)
  async save() {
    if (this.saving()) return;

    try {
      this.saving.set(true);
      this.loadbar.set(true);

      const chapterParam = this.getChapterParamFromRoute() ?? '';
      const typeId = this.form.controls.type_content_id.value!;
      const isYT      = this.isYouTube();
      const isArchivo = this.isArchivo();

      // Valor crudo del control url
      const raw = this.form.controls.url.value;

      // URL segura solo si es string
      const urlStr = (typeof raw === 'string') ? raw.trim() : '';

      // Archivo desde signal o desde el control (File[])
      let fileToSend: File | null = this.fileSel();
      if (!fileToSend && Array.isArray(raw) && raw.length && raw[0] instanceof File) {
        fileToSend = raw[0] as File;
      }

      const fd = new FormData();
      fd.append('type_content_id', String(typeId));

      if (isYT) {
        // YouTube: solo url (puede ir '' para limpiar)
        fd.append('url', urlStr);
      } else if (isArchivo) {
        if (fileToSend) {
          fd.append('file', fileToSend, fileToSend.name);
        } else {
          // Sin archivo: respeta urlStr ('' para limpiar en backend si lo deseas)
          fd.append('url', urlStr);
        }
      }

      const res = await firstValueFrom(
        this.chapterSrv.updateLearningContent(chapterParam, fd)
      );

      // Refresca estado local
      this.current.set(res);

      const name = res.learning_content?.type_learning_content?.name?.toLowerCase() ?? null;
      const typeBack =
        name === 'archivo' ? this.typeIdArchivo() :
        name === 'youtube' ? this.typeIdYoutube() : this.typeIdYoutube();

      const urlBack = res.learning_content?.url ?? '';

      // Restaura el formulario con lo guardado
      const nextUrlForForm = urlBack ? urlBack : null;

      this.form.reset({ type_content_id: typeBack, url: nextUrlForForm });
      this.selectedTypeId.set(typeBack);
      this.updateEmbedFromUrl(urlBack);
      this.fileSel.set(null);
      this.form.markAsPristine();
      this.sabed = true;

    } catch (err) {
      console.error(err);
      // aquí puedes disparar tu ui-toast de error si ya lo tienes
      // this.toast.error('No se pudo guardar los cambios');
    } finally {
      this.saving.set(false);
      this.loadbar.set(false);
    }
  }
}
