import {
  Component, OnInit, computed, effect,
  inject, signal, DestroyRef
} from '@angular/core';
import { CommonModule }                                                from '@angular/common';
import { FormBuilder, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute }                                              from '@angular/router';
import { DomSanitizer, SafeResourceUrl }                               from '@angular/platform-browser';
import { debounceTime, firstValueFrom }                                from 'rxjs';
import { takeUntilDestroyed }                                          from '@angular/core/rxjs-interop';


import { IconComponent }       from '../../../../../../../shared/UI/components/button/icon/icon.component';

import { ChapterService }      from '../../../../../../../core/api/chapter/chapter.service';
import {
  FormatItem,
  LearingContentResponse,
  LearningContent,
  TypeWithFormats,
} from '../../../../../../../core/api/chapter/chapter.interface';

// ── Conjuntos de clasificación de formatos ────────────────────────────────────
const MEDIA_FORMATS    = new Set(['mp4','webm','ogg','mov','m4v','avi','mkv','mp3','wav','aac','flac']);
const IMAGE_FORMATS    = new Set(['png','jpg','jpeg','gif','webp','bmp','svg']);
const LINK_TYPE        = 'link';
const ARCHIVE_TYPE     = 'archive';

/** Mapa formato → ícono SVG (ajusta los paths según tus assets) */
const FORMAT_ICON: Record<string, string> = {
  youtube: 'svg/youtube-color.svg',
  mp4:     'svg/video-color.svg',
  mp3:     'svg/audio-color.svg',
  pdf:     'svg/pdf-color.svg',
  docx:    'svg/word-color.svg',
  pptx:    'svg/powerpoint-color.svg',
  xlsx:    'svg/excel-color.svg',
  zip:     'svg/zip-color.svg',
  rar:     'svg/rar-color.svg',
  txt:     'svg/text-color.svg',
  jpg:     'svg/image-color.svg',
  jpeg:    'svg/image-color.svg',
  png:     'svg/image-color.svg',
  gif:     'svg/image-color.svg',
  webp:    'svg/image-color.svg',
};
const DEFAULT_FILE_ICON = 'svg/file-color.svg';

@Component({
  selector: 'app-content-learning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './content-learning.component.html',
  styleUrl: './content-learning.component.css',
})
export class ContentLearningComponent implements OnInit {

  private readonly route      = inject(ActivatedRoute);
  private readonly fb         = inject(FormBuilder);
  private readonly chapterSrv = inject(ChapterService);
  private readonly sanitizer  = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  // ── Estado principal ────────────────────────────────────────────────────────
  loading = signal(true);
  saving  = signal(false);
  loadbar = signal(false);

  types   = signal<TypeWithFormats[]>([]);
  current = signal<LearingContentResponse | null>(null);

  selectedTypeId   = signal<number | null>(null);
  selectedFormatId = signal<number | null>(null);

  fileSel    = signal<File | null>(null);
  dragOver   = signal(false);
  fileError  = signal<string | null>(null);
  isDirty    = signal(false);

  // ── Preview ──────────────────────────────────────────────────────────────────
  filePreviewUrl  = signal<string | null>(null);
  filePreviewType = signal<'image' | 'video' | 'audio' | 'pdf' | 'other' | null>(null);
  fileName        = signal<string | null>(null);
  fileSizeLabel   = signal<string | null>(null);

  fileSafePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const u = this.filePreviewUrl();
    return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null;
  });

  // YouTube embed
  private embedUrl = signal<string | null>(null);
  embedSafe = computed<SafeResourceUrl | null>(() => {
    const u = this.embedUrl();
    return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null;
  });

  // Formulario: solo el campo URL que el usuario teclea
  form = this.fb.group({ url: this.fb.control<string | null>(null) });

  // ── Computados derivados ─────────────────────────────────────────────────────
  selectedType   = computed<TypeWithFormats | null>(() =>
    this.types().find(t => t.id === this.selectedTypeId()) ?? null
  );
  selectedFormat = computed<FormatItem | null>(() =>
    this.selectedType()?.formats.find(f => f.id === this.selectedFormatId()) ?? null
  );

  isLinkType    = computed(() => (this.selectedType()?.name ?? '').toLowerCase() === LINK_TYPE);
  isArchiveType = computed(() => (this.selectedType()?.name ?? '').toLowerCase() === ARCHIVE_TYPE);
  isYouTubeFormat = computed(() => (this.selectedFormat()?.name ?? '').toLowerCase() === 'youtube');

  maxSizeBytes   = computed(() => this.selectedFormat()?.max_size_bytes      ?? null);
  minDurationSec = computed(() => this.selectedFormat()?.min_duration_seconds ?? null);
  maxDurationSec = computed(() => this.selectedFormat()?.max_duration_seconds ?? null);

  maxSizeMbLabel = computed(() => {
    const b = this.maxSizeBytes();
    return b ? Math.round(b / 1024 / 1024) : 900;
  });

  durationRangeLabel = computed<string | null>(() => {
    const min = this.minDurationSec();
    const max = this.maxDurationSec();
    if (!min && !max) return null;
    if (min && max) return `${this.secToMin(min)} – ${this.secToMin(max)}`;
    if (min)         return `Mín. ${this.secToMin(min)}`;
    return           `Máx. ${this.secToMin(max!)}`;
  });

  /** Extensiones mostrables en el UI */
  acceptedExtensions = computed<string>(() =>
    (this.selectedType()?.formats ?? []).map(f => '.' + f.name.toLowerCase()).join(', ')
  );

  /** Para el atributo [accept] del input file */
  acceptAttr = computed<string>(() =>
    (this.selectedType()?.formats ?? []).map(f => '.' + f.name.toLowerCase()).join(',')
  );

  canSave = computed(() =>
    !this.saving()    &&
    !this.fileError() &&
    this.isDirty()    &&
    !this.loading()   &&
    (this.isLinkType() ? !this.form.controls.url.hasError('youtubeUrl') : true)
  );

  // ── Icono por formato ─────────────────────────────────────────────────────────
  getFormatIcon(fmt?: string | null): string {
    return FORMAT_ICON[(fmt ?? '').toLowerCase()] ?? DEFAULT_FILE_ICON;
  }

  // ── Constructor ──────────────────────────────────────────────────────────────
  constructor() {
    // Validador youtube (solo cuando tipo=link y formato=youtube)
    effect(() => {
      const isYT = this.isLinkType() && this.isYouTubeFormat();
      this.form.controls.url.clearValidators();
      if (isYT) this.form.controls.url.addValidators(this.youtubeUrlOptionalValidator.bind(this));
      else      this.embedUrl.set(null);
      this.form.controls.url.updateValueAndValidity({ emitEvent: false });
    });

    // Preview YouTube mientras escribe
    this.form.controls.url.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        const str = (typeof v === 'string') ? v.trim() : '';
        if (str !== v) this.form.controls.url.setValue(str, { emitEvent: false });
        if (this.isLinkType()) this.updateEmbedFromUrl(str);
      });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.dirty) this.isDirty.set(true); });
  }

  ngOnInit(): void { void this.init(); }

  // ── Inicialización (una sola llamada HTTP) ─────────────────────────────────
  private async init(): Promise<void> {
    this.loading.set(true);
    this.isDirty.set(false);
    try {
      const res = await firstValueFrom(
        this.chapterSrv.showLearningContent(this.getChapterParam())
      );
      this.types.set(res.types ?? []);
      this.current.set(res);
      res.learning_content
        ? this.applyContentToState(res.learning_content, res.types)
        : this.applyDefaultSelection(res.types);
    } catch {
      this.applyDefaultSelection(this.types());
    } finally {
      this.form.markAsPristine();
      this.fileSel.set(null);
      this.fileError.set(null);
      this.isDirty.set(false);
      this.loading.set(false);
    }
  }

  private applyContentToState(lc: LearningContent, types: TypeWithFormats[]): void {
    const typeName   = (lc.type_learning_content?.name ?? '').toLowerCase();
    const formatName = (lc.format?.name ?? '').toLowerCase();

    const matchType   = types.find(t => t.id === lc.type_content_id) ?? types[0] ?? null;
    const matchFormat = matchType?.formats.find(f => f.id === lc.format_id)
      ?? matchType?.formats[0] ?? null;

    this.selectedTypeId.set(matchType?.id   ?? null);
    this.selectedFormatId.set(matchFormat?.id ?? null);

    if (typeName === LINK_TYPE) {
      this.form.controls.url.setValue(lc.url || null, { emitEvent: false });
      this.updateEmbedFromUrl(lc.url || '');
      this.clearFilePreview();
    } else if (typeName === ARCHIVE_TYPE) {
      this.form.controls.url.setValue(null, { emitEvent: false });
      this.embedUrl.set(null);
      this.setFilePreviewFromBackend(lc.url || null, lc.name, formatName, lc.size_bytes);
    } else {
      this.form.controls.url.setValue(null, { emitEvent: false });
      this.embedUrl.set(null);
      this.clearFilePreview();
    }
  }

  private applyDefaultSelection(types: TypeWithFormats[]): void {
    const firstType   = types[0]             ?? null;
    const firstFormat = firstType?.formats[0] ?? null;
    this.selectedTypeId.set(firstType?.id   ?? null);
    this.selectedFormatId.set(firstFormat?.id ?? null);
    this.form.controls.url.setValue(null, { emitEvent: false });
    this.embedUrl.set(null);
    this.clearFilePreview();
  }

  // ── Selector de tipo ─────────────────────────────────────────────────────────
  pickType(type: TypeWithFormats): void {
    if (type.id === this.selectedTypeId()) return;

    this.fileSel.set(null);
    this.fileError.set(null);
    this.revokePreviewUrl();
    this.clearFilePreview();
    this.embedUrl.set(null);
    this.form.controls.url.setValue(null, { emitEvent: false });
    this.selectedTypeId.set(type.id);

    // Link: auto-seleccionar primer formato. Archive: esperar al archivo
    if (type.name.toLowerCase() === LINK_TYPE) {
      this.selectedFormatId.set(type.formats[0]?.id ?? null);
    } else {
      this.selectedFormatId.set(null);
    }

    this.form.markAsDirty();
    this.isDirty.set(true);
  }

  reset(): void {
    this.fileSel.set(null);
    this.fileError.set(null);
    this.revokePreviewUrl();
    this.dragOver.set(false);
    const res = this.current();
    res?.learning_content
      ? this.applyContentToState(res.learning_content, res.types ?? this.types())
      : this.applyDefaultSelection(this.types());
    this.form.markAsPristine();
    this.isDirty.set(false);
  }

  // ── Drag & Drop / File Input ─────────────────────────────────────────────────
  onDragOver(ev: DragEvent)  { ev.preventDefault(); ev.stopPropagation(); this.dragOver.set(true);  }
  onDragLeave(ev: DragEvent) { ev.preventDefault(); ev.stopPropagation(); this.dragOver.set(false); }

  onDrop(ev: DragEvent): void {
    ev.preventDefault(); ev.stopPropagation();
    this.dragOver.set(false);
    const file = ev.dataTransfer?.files?.[0];
    if (file) void this.handleIncomingFile(file);
  }

  onFileInputChange(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (file) void this.handleIncomingFile(file);
  }

  openFileDialog(input: HTMLInputElement | null): void { input?.click(); }

  async handleIncomingFile(file: File): Promise<void> {
    this.fileError.set(null);

    // 1. Buscar formato por extensión
    const ext         = file.name.split('.').pop()?.toLowerCase() ?? '';
    const archiveType = this.types().find(t => t.name.toLowerCase() === ARCHIVE_TYPE);
    const fmt         = archiveType?.formats.find(f => f.name.toLowerCase() === ext) ?? null;

    if (!fmt) {
      this.fileError.set(
        `Formato ".${ext}" no permitido. Acepta: ${this.acceptedExtensions()}`
      );
      return;
    }

    // 2. Tamaño
    if (fmt.max_size_bytes && file.size > fmt.max_size_bytes) {
      const mb = Math.round(fmt.max_size_bytes / 1024 / 1024);
      this.fileError.set(`El archivo supera el máximo de ${mb} MB.`);
      return;
    }

    // 3. Duración (solo media)
    if (MEDIA_FORMATS.has(ext) && (fmt.min_duration_seconds || fmt.max_duration_seconds)) {
      const dur = await this.getMediaDuration(file);
      if (dur == null) {
        this.fileError.set('No se pudo leer la duración. Intenta con otro archivo.');
        return;
      }
      if (fmt.min_duration_seconds && dur < fmt.min_duration_seconds) {
        this.fileError.set(`Duración mínima: ${this.secToMin(fmt.min_duration_seconds)} (detectado: ${this.secToMin(dur)}).`);
        return;
      }
      if (fmt.max_duration_seconds && dur > fmt.max_duration_seconds) {
        this.fileError.set(`Duración máxima: ${this.secToMin(fmt.max_duration_seconds)} (detectado: ${this.secToMin(dur)}).`);
        return;
      }
    }

    // 4. OK
    this.fileSel.set(file);
    this.selectedTypeId.set(archiveType!.id);
    this.selectedFormatId.set(fmt.id);
    this.setFilePreviewFromFile(file);
    this.embedUrl.set(null);
    this.form.controls.url.setValue(null, { emitEvent: false });
    this.form.markAsDirty();
    this.isDirty.set(true);
  }

  clearFile(): void {
    this.fileError.set(null);
    this.fileSel.set(null);
    this.revokePreviewUrl();
    const lc          = this.current()?.learning_content;
    const archiveType = this.types().find(t => t.name.toLowerCase() === ARCHIVE_TYPE);
    if (lc && archiveType?.formats.find(f => f.id === lc.format_id)) {
      this.selectedFormatId.set(lc.format_id);
      this.setFilePreviewFromBackend(lc.url || null, lc.name, lc.format?.name ?? '', lc.size_bytes);
    } else {
      this.selectedFormatId.set(null);
      this.clearFilePreview();
    }
    this.form.markAsDirty();
    this.isDirty.set(true);
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  async save(): Promise<void> {
    if (!this.canSave()) return;

    const typeId   = this.selectedTypeId();
    const formatId = this.selectedFormatId();
    if (!typeId || !formatId) {
      this.fileError.set('Selecciona un tipo y formato antes de guardar.');
      return;
    }

    this.saving.set(true);
    this.loadbar.set(true);

    try {
      const fd = new FormData();
      fd.append('type_content_id', String(typeId));
      fd.append('format_id',       String(formatId));

      if (this.isLinkType()) {
        fd.append('url', (this.form.controls.url.value ?? '').trim());
      } else {
        const file = this.fileSel();
        if (file) {
          fd.append('file', file, file.name);
          fd.append('name', file.name);
        } else {
          fd.append('url', this.current()?.learning_content?.url ?? '');
        }
      }

      const res = await firstValueFrom(
        this.chapterSrv.updateLearningContent(this.getChapterParam(), fd)
      );

      this.types.set(res.types ?? this.types());
      this.current.set(res);

      res.learning_content
        ? this.applyContentToState(res.learning_content, res.types)
        : this.applyDefaultSelection(res.types);

      this.fileSel.set(null);
      this.fileError.set(null);
      this.form.markAsPristine();
      this.isDirty.set(false);

    } catch (err: any) {
      const e = err?.error?.errors;
      this.fileError.set(
        e?.file?.[0] ?? e?.format_id?.[0] ?? err?.error?.message ?? 'No se pudo guardar.'
      );
    } finally {
      this.saving.set(false);
      this.loadbar.set(false);
    }
  }

  openPreviewInNewTab(): void {
    const u = this.filePreviewUrl();
    if (u) window.open(u, '_blank');
  }

  // ── YouTube ──────────────────────────────────────────────────────────────────
  private updateEmbedFromUrl(url: string): void {
    if (!this.isLinkType()) { this.embedUrl.set(null); return; }
    const id = this.extractYouTubeId(url);
    this.embedUrl.set(id ? `https://www.youtube.com/embed/${id}?rel=0` : null);
  }

  private youtubeUrlOptionalValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = (ctrl.value ?? '').toString().trim();
    if (!v) return null;
    return this.extractYouTubeId(v) ? null : { youtubeUrl: true };
  }

  private extractYouTubeId(raw: string): string | null {
    if (!raw) return null;
    try {
      const url  = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const host = url.hostname.replace(/^www\./i, '').toLowerCase();

      if (host === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0];
        return this.isValidYtId(id) ? id : null;
      }
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const p = url.pathname.toLowerCase();
        const v = url.searchParams.get('v');
        if (v && this.isValidYtId(v))     return v;
        const seg = p.startsWith('/shorts/') ? 1 : p.startsWith('/embed/') ? 1 : -1;
        if (seg !== -1) {
          const id = url.pathname.split('/').filter(Boolean)[seg];
          return this.isValidYtId(id) ? id : null;
        }
      }
    } catch { /* fallback */ }
    const m = raw.match(/(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m?.[1] && this.isValidYtId(m[1]) ? m[1] : null;
  }

  private isValidYtId(id?: string | null): boolean {
    return !!id && /^[A-Za-z0-9_-]{6,}$/.test(id);
  }

  // ── File preview helpers ─────────────────────────────────────────────────────
  private setFilePreviewFromFile(file: File): void {
    this.revokePreviewUrl();
    this.filePreviewUrl.set(URL.createObjectURL(file));
    this.filePreviewType.set(this.detectPreviewType(file.name, file.type));
    this.fileName.set(file.name);
    this.fileSizeLabel.set(this.formatBytes(file.size));
  }

  private setFilePreviewFromBackend(
    url: string | null,
    name?: string | null,
    formatName?: string,
    sizeBytes?: number | null
  ): void {
    this.revokePreviewUrl();
    if (!url) { this.clearFilePreview(); return; }
    const displayName = name || url.split('/').pop() || 'archivo';
    const mime        = formatName ? this.mimeFromFormat(formatName) : undefined;
    this.filePreviewUrl.set(url);
    this.filePreviewType.set(this.detectPreviewType(displayName, mime));
    this.fileName.set(displayName);
    this.fileSizeLabel.set(sizeBytes ? this.formatBytes(sizeBytes) : null);
  }

  private clearFilePreview(): void {
    this.filePreviewUrl.set(null);
    this.filePreviewType.set(null);
    this.fileName.set(null);
    this.fileSizeLabel.set(null);
  }

  private revokePreviewUrl(): void {
    const u = this.filePreviewUrl();
    if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
  }

  private detectPreviewType(name: string, mime?: string): 'image' | 'video' | 'audio' | 'pdf' | 'other' {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (mime?.startsWith('image/') || IMAGE_FORMATS.has(ext))                          return 'image';
    if (mime?.startsWith('video/') || ['mp4','webm','ogg','mkv','mov'].includes(ext))   return 'video';
    if (mime?.startsWith('audio/') || ['mp3','wav','aac','flac'].includes(ext))         return 'audio';
    if (ext === 'pdf')                                                                   return 'pdf';
    return 'other';
  }

  private mimeFromFormat(fmt: string): string | undefined {
    const m: Record<string, string> = {
      mp4:'video/mp4', webm:'video/webm', mp3:'audio/mpeg',
      pdf:'application/pdf',
      jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png',
      gif:'image/gif',  webp:'image/webp',
    };
    return m[fmt.toLowerCase()];
  }

  private getMediaDuration(file: File): Promise<number | null> {
    return new Promise<number | null>(resolve => {
      const url = URL.createObjectURL(file);
      const el  = file.type.startsWith('audio/')
        ? document.createElement('audio')
        : document.createElement('video');
      el.preload = 'metadata';
      el.src     = url;
      el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(el.duration || null); };
      el.onerror          = () => { URL.revokeObjectURL(url); resolve(null); };
    });
  }

  // ── Utilities ────────────────────────────────────────────────────────────────
  private getChapterParam(): string {
    return (
      this.route.snapshot.paramMap.get('chapter') ??
      this.route.parent?.snapshot.paramMap.get('chapter') ??
      ''
    );
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(i === 0 ? 0 : 1)} ${s[i]}`;
  }

  secToMin(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }
}