import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { debounceTime, firstValueFrom } from 'rxjs';

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
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, IconComponent, LoadingBarComponent],
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

  // ====== límites de validación ======
  readonly MAX_FILE_MB = 100;
  readonly MIN_VIDEO_SECONDS = 10;
  readonly MAX_VIDEO_SECONDS = 480;
  private readonly MAX_FILE_BYTES = this.MAX_FILE_MB * 1024 * 1024;

  // ====== estado drag & drop / errores ======
  dragOver = signal<boolean>(false);
  fileError = signal<string | null>(null);

  // ====== previsualización del archivo (tipo Classroom) ======
  filePreviewUrl = signal<string | null>(null); // blob: o url del backend
  filePreviewType = signal<'image' | 'video' | 'audio' | 'pdf' | 'other' | null>(null);
  fileName = signal<string | null>(null);
  fileSizeLabel = signal<string | null>(null);

  fileSafePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.filePreviewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

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
        url: initialUrl ? initialUrl : null
      }, { emitEvent: true });

      this.selectedTypeId.set(this.form.controls.type_content_id.value);

      if (name === 'youtube') {
        this.updateEmbedFromUrl(initialUrl);
        this.updateFilePreviewFromBackend(null);
      } else if (name === 'archivo') {
        this.embedUrl.set(null);
        this.updateFilePreviewFromBackend(initialUrl || null);
      } else {
        this.embedUrl.set(null);
        this.updateFilePreviewFromBackend(null);
      }

      this.form.markAsPristine();
      this.fileSel.set(null);
      this.fileError.set(null);
    } catch {
      const yt = this.types().find(t => (t.name ?? '').toLowerCase() === 'youtube');
      this.form.patchValue({ type_content_id: yt?.id ?? null, url: '' }, { emitEvent: true });
      this.selectedTypeId.set(this.form.controls.type_content_id.value);
      this.embedUrl.set(null);
      this.updateFilePreviewFromBackend(null);
      this.form.markAsPristine();
      this.fileSel.set(null);
      this.fileError.set(null);
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
    this.fileError.set(null);
    this.updateFilePreviewFromBackend(null);
    this.revokePreviewUrl();

    this.form.controls.url.setValue('', { emitEvent: true }); // borra valor del archivo/url
    this.embedUrl.set(null); // y el embed, hasta que escriban una URL
    this.form.markAsDirty();
    this.sabed = false;
  }

  pickArchivo() {
    const id = this.typeIdArchivo();
    if (!id) return;

    this.form.controls.type_content_id.setValue(id);
    this.selectedTypeId.set(id);

    this.fileSel.set(null);
    this.fileError.set(null);
    this.embedUrl.set(null);

    // Si lo último guardado era archivo, muestra ese; si no, limpia
    const lc = this.current();
    const isFileFromBackend = lc?.learning_content?.type_learning_content?.name?.toLowerCase() === 'archivo';
    const urlBack = isFileFromBackend ? (lc?.learning_content?.url ?? '') : '';

    this.updateFilePreviewFromBackend(urlBack || null);

    // En el control dejamos la url del backend (o null)
    this.form.controls.url.setValue(urlBack || null, { emitEvent: true });
    this.form.markAsDirty();
    this.sabed = false;
  }

  // ====== MANEJO DE ARCHIVOS (drag & drop, selección, validación) ======

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const dt = event.dataTransfer;
    if (!dt || !dt.files?.length) return;
    const file = dt.files[0];
    void this.handleIncomingFile(file);
  }

  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (file) {
      void this.handleIncomingFile(file);
    }
  }

  openFileDialog(input: HTMLInputElement | null) {
    input?.click();
  }

  async handleIncomingFile(file: File): Promise<void> {
    this.fileError.set(null);

    // Tamaño máximo
    if (file.size > this.MAX_FILE_BYTES) {
      this.fileError.set(`El archivo supera el tamaño máximo permitido de ${this.MAX_FILE_MB} MB.`);
      this.clearFileInternal(false);
      return;
    }

    // Validación de duración para videos
    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      const duration = await this.getVideoDuration(file);
      if (duration == null) {
        this.fileError.set('No se pudo leer la duración del video. Intenta con otro archivo.');
        this.clearFileInternal(false);
        return;
      }
      if (duration < this.MIN_VIDEO_SECONDS || duration > this.MAX_VIDEO_SECONDS) {
        this.fileError.set(
          `La duración del video debe estar entre ${this.MIN_VIDEO_SECONDS} y ${this.MAX_VIDEO_SECONDS} segundos. ` +
          `Duración detectada: ${Math.round(duration)} s.`
        );
        this.clearFileInternal(false);
        return;
      }
    }

    // Si todo ok: selecciona archivo
    this.fileSel.set(file);
    this.form.controls.type_content_id.setValue(this.typeIdArchivo());
    this.selectedTypeId.set(this.typeIdArchivo());
    this.form.controls.url.setValue([file], { emitEvent: true });

    this.updateFilePreviewFromFile(file);
    this.embedUrl.set(null);
    this.form.markAsDirty();
    this.sabed = false;
  }

  private getVideoDuration(file: File): Promise<number | null> {
    return new Promise<number | null>((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;

      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(url);
        resolve(duration || null);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    });
  }

  private detectPreviewType(name: string, mime?: string): 'image' | 'video' | 'audio' | 'pdf' | 'other' {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';

    if (mime?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'image';
    }
    if (mime?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mkv', 'mov'].includes(ext)) {
      return 'video';
    }
    if (mime?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) {
      return 'audio';
    }
    if (ext === 'pdf') return 'pdf';

    return 'other';
  }

  private updateFilePreviewFromFile(file: File) {
    this.revokePreviewUrl();
    const url = URL.createObjectURL(file);

    this.filePreviewUrl.set(url);
    this.filePreviewType.set(this.detectPreviewType(file.name, file.type));
    this.fileName.set(file.name);
    this.fileSizeLabel.set(this.formatBytes(file.size));
  }

  private updateFilePreviewFromBackend(url: string | null) {
    this.revokePreviewUrl();

    if (!url) {
      this.filePreviewUrl.set(null);
      this.filePreviewType.set(null);
      this.fileName.set(null);
      this.fileSizeLabel.set(null);
      return;
    }

    const nameFromPath = url.split('/').pop() ?? 'archivo';
    this.filePreviewUrl.set(url);
    this.filePreviewType.set(this.detectPreviewType(nameFromPath));
    this.fileName.set(nameFromPath);
    this.fileSizeLabel.set(null); // no conocemos el tamaño del backend
  }

  private revokePreviewUrl() {
    const current = this.filePreviewUrl();
    if (current && current.startsWith('blob:')) {
      URL.revokeObjectURL(current);
    }
  }

  private formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  private clearFileInternal(markDelete: boolean) {
    this.fileSel.set(null);
    this.revokePreviewUrl();
    this.filePreviewUrl.set(null);
    this.filePreviewType.set(null);
    this.fileName.set(null);
    this.fileSizeLabel.set(null);

    if (markDelete) {
      // url = '' → backend puede interpretarlo como borrar archivo
      this.form.controls.url.setValue('', { emitEvent: true });
    } else {
      // Solo limpiar selección local, manteniendo lo último del backend
      const lc = this.current();
      const name = lc?.learning_content?.type_learning_content?.name?.toLowerCase() ?? null;
      const urlBack = name === 'archivo' ? (lc?.learning_content?.url ?? '') : '';
      this.form.controls.url.setValue(urlBack || null, { emitEvent: true });
    }
  }

  clearFile() {
    // El usuario quiere eliminar el archivo (actual o nuevo)
    this.fileError.set(null);
    this.clearFileInternal(true);
    this.form.markAsDirty();
    this.sabed = false;
  }

  openPreviewInNewTab() {
    const url = this.filePreviewUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  reset() {
    const lc = this.current();
    const name = lc?.learning_content?.type_learning_content?.name?.toLowerCase() ?? null;

    const typeBack =
      name === 'archivo' ? this.typeIdArchivo() :
      name === 'youtube' ? this.typeIdYoutube() : this.typeIdYoutube();

    const urlBack = lc?.learning_content?.url ?? '';

    const urlForForm = urlBack ? urlBack : null;

    this.form.reset({ type_content_id: typeBack, url: urlForForm });
    this.selectedTypeId.set(typeBack);

    this.fileSel.set(null);
    this.fileError.set(null);
    this.dragOver.set(false);

    if (name === 'youtube') {
      this.updateEmbedFromUrl(urlBack);
      this.updateFilePreviewFromBackend(null);
    } else if (name === 'archivo') {
      this.embedUrl.set(null);
      this.updateFilePreviewFromBackend(urlBack || null);
    } else {
      this.embedUrl.set(null);
      this.updateFilePreviewFromBackend(null);
    }

    this.form.markAsPristine();
    this.sabed = true;
  }

  // Guardar con soporte YouTube/Archivo (prioriza File si existe)
  async save() {
    if (this.saving()) return;
    if (this.fileError()) return; // no guardamos si hay error de archivo

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

      if (name === 'youtube') {
        this.updateEmbedFromUrl(urlBack);
        this.updateFilePreviewFromBackend(null);
      } else if (name === 'archivo') {
        this.embedUrl.set(null);
        this.updateFilePreviewFromBackend(urlBack || null);
      } else {
        this.embedUrl.set(null);
        this.updateFilePreviewFromBackend(null);
      }

      this.fileSel.set(null);
      this.fileError.set(null);
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
