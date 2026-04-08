import {
  Component, OnInit, computed, effect,
  inject, signal, DestroyRef
} from '@angular/core';
import { CommonModule }                                                from '@angular/common';
import { FormBuilder, ReactiveFormsModule, AbstractControl, ValidationErrors, Validators } from '@angular/forms';
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
  LearningContentUpdate,
} from '../../../../../../../core/api/chapter/chapter.interface';
import { LoadingBarComponent } from '../../../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

// ── Conjuntos de clasificación de formatos ────────────────────────────────────
const MEDIA_FORMATS    = new Set(['mp4','webm','ogg','mov','m4v','avi','mkv','mp3','wav','aac','flac']);
const LINK_TYPE        = 'link';
const ARCHIVE_TYPE     = 'archive';

// Google Drive y OneDrive formats
const GOOGLEDRIVE_FORMATS = new Set(['googledrive.video','googledrive.audio','googledrive.pdf','googledrive.docx','googledrive.pptx','googledrive.xlsx','googledrive.compressed','googledrive.txt','googledrive.other']);
const ONEDRIVE_FORMATS = new Set(['onedrive.video','onedrive.audio','onedrive.pdf','onedrive.docx','onedrive.pptx','onedrive.xlsx','onedrive.compressed','onedrive.txt','onedrive.other']);

/** Mapa formato → ícono SVG */
const FORMAT_ICON: Record<string, string> = {
  youtube:                  'svg/youtube-color.svg',
  video:                    'svg/video-color.svg',
  audio:                    'svg/audio-color.svg',
  pdf:                      'svg/pdf-color.svg',
  docx:                     'svg/word-color.svg',
  pptx:                     'svg/powerpoint-color.svg',
  xlsx:                     'svg/excel-color.svg',
  compressed:               'svg/zip-color.svg',
  txt:                      'svg/text-color.svg',
  'googledrive.video':      'svg/video-color.svg',
  'googledrive.audio':      'svg/audio-color.svg',
  'googledrive.pdf':        'svg/pdf-color.svg',
  'googledrive.docx':       'svg/word-color.svg',
  'googledrive.pptx':       'svg/powerpoint-color.svg',
  'googledrive.xlsx':       'svg/excel-color.svg',
  'googledrive.compressed': 'svg/zip-color.svg',
  'googledrive.txt':        'svg/text-color.svg',
  'googledrive.other':      'svg/file-color.svg',
  'onedrive.video':         'svg/video-color.svg',
  'onedrive.audio':         'svg/audio-color.svg',
  'onedrive.pdf':           'svg/pdf-color.svg',
  'onedrive.docx':          'svg/word-color.svg',
  'onedrive.pptx':          'svg/powerpoint-color.svg',
  'onedrive.xlsx':          'svg/excel-color.svg',
  'onedrive.compressed':    'svg/zip-color.svg',
  'onedrive.txt':           'svg/text-color.svg',
  'onedrive.other':         'svg/file-color.svg',
};
const DEFAULT_FILE_ICON = 'svg/file-color.svg';

@Component({
  selector: 'app-content-learning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, LoadingBarComponent],
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
  filePreviewType = signal<'video' | 'audio' | 'pdf' | 'other' | null>(null);
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

  // ── Form: URLs y metadatos dinámicos ─────────────────────────────────────────
  form = this.fb.group({
    url:               this.fb.control<string | null>(null),
    url_insert:        this.fb.control<string | null>(null),
    name:              this.fb.control<string | null>(null),
    size_value:        this.fb.control<number | null>(null),
    size_unit:         this.fb.control<'B' | 'KB' | 'MB' | 'GB' | 'TB'>('MB'),
    duration_str:      this.fb.control<string | null>(null), // "MM:SS" o "HH:MM:SS"
  });

  // ── Computados derivados ─────────────────────────────────────────────────────
  sortedTypes = computed(() => {
    const ts = this.types();
    return ts.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      // Orden: link primero, luego archive
      if (aName === LINK_TYPE && bName !== LINK_TYPE) return -1;
      if (aName !== LINK_TYPE && bName === LINK_TYPE) return 1;
      return 0;
    });
  });

  sortedLinkFormats = computed(() => {
    const type = this.sortedTypes().find(t => t.name.toLowerCase() === LINK_TYPE);
    if (!type) return [];
    return type.formats.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      // Orden: youtube, luego googledrive, luego onedrive
      if (aName === 'youtube') return -1;
      if (bName === 'youtube') return 1;
      if (aName.startsWith('googledrive') && !bName.startsWith('googledrive')) return -1;
      if (!aName.startsWith('googledrive') && bName.startsWith('googledrive')) return 1;
      if (aName.startsWith('onedrive') && !bName.startsWith('onedrive')) return 1;
      if (!aName.startsWith('onedrive') && bName.startsWith('onedrive')) return -1;
      return a.name.localeCompare(b.name);
    });
  });

  selectedType = computed<TypeWithFormats | null>(() =>
    this.types().find(t => t.id === this.selectedTypeId()) ?? null
  );

  selectedFormat = computed<FormatItem | null>(() =>
    this.selectedType()?.formats.find(f => f.id === this.selectedFormatId()) ?? null
  );

  isLinkType    = computed(() => (this.selectedType()?.name ?? '').toLowerCase() === LINK_TYPE);
  isArchiveType = computed(() => (this.selectedType()?.name ?? '').toLowerCase() === ARCHIVE_TYPE);
  isYouTubeFormat = computed(() => (this.selectedFormat()?.name ?? '').toLowerCase() === 'youtube');
  isGoogleDriveFormat = computed(() => GOOGLEDRIVE_FORMATS.has((this.selectedFormat()?.name ?? '').toLowerCase()));
  isOneDriveFormat = computed(() => ONEDRIVE_FORMATS.has((this.selectedFormat()?.name ?? '').toLowerCase()));

  maxSizeBytes   = computed(() => this.selectedFormat()?.max_size_bytes ?? null);
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
    if (min)        return `Mín. ${this.secToMin(min)}`;
    return          `Máx. ${this.secToMin(max!)}`;
  });

  /** Extensiones mostrables en el UI */
  acceptedExtensions = computed<string>(() =>
    (this.selectedType()?.formats ?? []).map(f => '.' + f.name.toLowerCase()).join(', ')
  );

  /** Para el atributo [accept] del input file */
  acceptAttr = computed<string>(() => {
    const formats = this.selectedType()?.formats ?? [];
    const accepts: string[] = [];
    for (const f of formats) {
      const name = f.name.toLowerCase();
      if (name === 'video') {
        accepts.push('video/*');
      } else if (name === 'audio') {
        accepts.push('audio/*');
      } else {
        accepts.push('.' + name);
      }
    }
    return accepts.join(',');
  });

  canSave = computed(() => {
    if (this.saving() || !this.isDirty() || this.loading()) return false;

    const typeId = this.selectedTypeId();
    if (!typeId) return false;

    const isLinkType = this.isLinkType();
    const isArchiveType = this.isArchiveType();
    const isGDrive = this.isGoogleDriveFormat();
    const isOneDrive = this.isOneDriveFormat();

    if (isLinkType) {
      const formatId = this.selectedFormatId();
      if (!formatId) return false;
      if (this.isYouTubeFormat() && this.form.controls.url.hasError('youtubeUrl')) return false;
      if (isGDrive && !this.form.controls.url.value?.trim()) return false;
      if (isOneDrive && !this.form.controls.url_insert.value?.trim()) return false;
    } else if (isArchiveType) {
      if (!this.fileSel()) return false;
    }

    return true;
  });

  // ── Icono por formato ─────────────────────────────────────────────────────────
  getFormatIcon(fmt?: string | null): { base: string; badge?: string } {
    const name = (fmt ?? '').toLowerCase();
    if (name === 'youtube') return { base: FORMAT_ICON['youtube'] };
    if (name.startsWith('googledrive.')) {
      const base = FORMAT_ICON[name] || FORMAT_ICON['googledrive.other'];
      return { base, badge: 'svg/googledrive-color.svg' };
    }
    if (name.startsWith('onedrive.')) {
      const base = FORMAT_ICON[name] || FORMAT_ICON['onedrive.other'];
      return { base, badge: 'svg/onedrive-color.svg' };
    }
    return { base: FORMAT_ICON[name] ?? DEFAULT_FILE_ICON };
  }

  // ── Validadores ──────────────────────────────────────────────────────────────
  private youtubeUrlOptionalValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = (ctrl.value ?? '').toString().trim();
    if (!v) return null;
    return this.extractYouTubeId(v) ? null : { youtubeUrl: true };
  }

  private googleDriveUrlValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = (ctrl.value ?? '').toString().trim();
    if (!v) return null;
    try {
      const url = new URL(v);
      if (url.hostname.includes('drive.google.com') || url.hostname.includes('docs.google.com')) {
        return null;
      }
    } catch { /* */ }
    return { googleDriveUrl: true };
  }

  private oneDriveUrlValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = (ctrl.value ?? '').toString().trim();
    if (!v) return null;
    try {
      const url = new URL(v);
      if (url.hostname.includes('1drv.ms') || url.hostname.includes('onedrive.live.com')) {
        return null;
      }
    } catch { /* */ }
    return { oneDriveUrl: true };
  }

  // ── Constructor ──────────────────────────────────────────────────────────────
  constructor() {
    // Validador YouTube, Google Drive y OneDrive
    effect(() => {
      const isYT = this.isLinkType() && this.isYouTubeFormat();
      const isGDrive = this.isLinkType() && this.isGoogleDriveFormat();
      const isOneDrive = this.isLinkType() && this.isOneDriveFormat();
      this.form.controls.url.clearValidators();
      this.form.controls.url_insert.clearValidators();
      if (isYT) this.form.controls.url.addValidators(this.youtubeUrlOptionalValidator.bind(this));
      if (isGDrive) this.form.controls.url.addValidators(this.googleDriveUrlValidator.bind(this));
      if (isOneDrive) this.form.controls.url_insert.addValidators(this.oneDriveUrlValidator.bind(this));
      this.form.controls.url.updateValueAndValidity({ emitEvent: false });
      this.form.controls.url_insert.updateValueAndValidity({ emitEvent: false });
    });

    // Preview YouTube mientras escribe
    this.form.controls.url.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        const str = (typeof v === 'string') ? v.trim() : '';
        if (str !== v) this.form.controls.url.setValue(str, { emitEvent: false });
        if (this.isLinkType()) this.updateEmbedFromUrl(str);
      });

    // Google Drive: converter URL a url_insert automáticamente
    effect(() => {
      if (!this.isGoogleDriveFormat()) return;
      const url = this.form.controls.url.value?.trim() || '';
      if (url && url.includes('drive.google.com')) {
        const urlInsert = this.convertGoogleDriveUrl(url);
        if (urlInsert !== this.form.controls.url_insert.value) {
          this.form.controls.url_insert.setValue(urlInsert, { emitEvent: false });
        }
      }
    });

    // OneDrive: procesar url_insert si es iframe completo o img
    effect(() => {
      if (!this.isOneDriveFormat()) return;
      const urlInsert = this.form.controls.url_insert.value?.trim() || '';
      if (urlInsert) {
        const extracted = this.extractOneDriveSrc(urlInsert);
        if (extracted && extracted !== urlInsert) {
          this.form.controls.url_insert.setValue(extracted, { emitEvent: false });
        }
      }
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { if (this.form.dirty) this.isDirty.set(true); });
  }

  ngOnInit(): void { void this.init(); }

  // ── Inicialización ───────────────────────────────────────────────────────────
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

    this.selectedTypeId.set(matchType?.id ?? null);
    this.selectedFormatId.set(null); // No seleccionar formato específico

    if (typeName === LINK_TYPE) {
      this.selectedFormatId.set(lc.format_id);
      this.form.controls.url.setValue(lc.url || null, { emitEvent: false });
      this.form.controls.url_insert.setValue(lc.url_insert || null, { emitEvent: false });
      if (lc.duration_seconds) {
        this.form.controls.duration_str.setValue(this.secToTimeStr(lc.duration_seconds), { emitEvent: false });
      }
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
    const firstType = types[0] ?? null;
    const firstFormat = firstType?.formats[0] ?? null;
    this.selectedTypeId.set(firstType?.id ?? null);
    this.selectedFormatId.set(null);
    this.clearFormFields();
  }

  // ── Selector de tipo ─────────────────────────────────────────────────────────
  pickType(type: TypeWithFormats): void {
    if (type.id === this.selectedTypeId()) return;

    this.fileSel.set(null);
    this.fileError.set(null);
    this.revokePreviewUrl();
    this.clearFilePreview();
    this.clearFormFields();
    this.embedUrl.set(null);
    this.selectedTypeId.set(type.id);
    this.selectedFormatId.set(null);

    this.form.markAsDirty();
    this.isDirty.set(true);
  }

  // ── Selector de formato ──────────────────────────────────────────────────────
  pickFormat(format: FormatItem): void {
    if (format.id === this.selectedFormatId()) return;

    this.selectedFormatId.set(format.id);
    this.fileSel.set(null);
    this.fileError.set(null);
    this.revokePreviewUrl();
    this.clearFilePreview();
    this.clearFormFields();
    this.embedUrl.set(null);

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
  onDragOver(ev: DragEvent) { ev.preventDefault(); ev.stopPropagation(); this.dragOver.set(true); }
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

    const ext         = file.name.split('.').pop()?.toLowerCase() ?? '';
    const archiveType = this.types().find(t => t.name.toLowerCase() === ARCHIVE_TYPE);
    let fmt: FormatItem | null = null;

    // Buscar formato exacto o genérico
    for (const f of archiveType?.formats ?? []) {
      const fName = f.name.toLowerCase();
      if (fName === ext) {
        fmt = f;
        break;
      } else if (fName === 'video' && file.type.startsWith('video/')) {
        fmt = f;
        break;
      } else if (fName === 'audio' && file.type.startsWith('audio/')) {
        fmt = f;
        break;
      }
    }

    if (!fmt) {
      this.fileError.set(`Formato ".${ext}" no permitido. Acepta: ${this.acceptedExtensions()}`);
      return;
    }

    if (fmt.max_size_bytes && file.size > fmt.max_size_bytes) {
      const mb = Math.round(fmt.max_size_bytes / 1024 / 1024);
      this.fileError.set(`El archivo supera el máximo de ${mb} MB.`);
      return;
    }

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

    this.fileSel.set(file);
    this.setFilePreviewFromFile(file);
    this.embedUrl.set(null);
    this.form.controls.name.setValue(file.name, { emitEvent: false });
    const { value, unit } = this.bytesToValueUnit(file.size);
    this.form.controls.size_value.setValue(value, { emitEvent: false });
    this.form.controls.size_unit.setValue(unit, { emitEvent: false });
    this.form.markAsDirty();
    this.isDirty.set(true);
  }

  clearFile(): void {
    this.fileError.set(null);
    this.fileSel.set(null);
    this.revokePreviewUrl();
    this.clearFilePreview();
    this.form.markAsDirty();
    this.isDirty.set(true);
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  async save(): Promise<void> {
    if (!this.canSave()) return;

    const typeId = this.selectedTypeId();
    if (!typeId) {
      this.fileError.set('Selecciona un tipo de contenido antes de guardar.');
      return;
    }

    this.saving.set(true);
    this.loadbar.set(true);

    try {
      const payload: Partial<LearningContentUpdate> = {
        type_content_id: typeId,
      };

      if (this.isLinkType()) {
        const formatId = this.selectedFormatId();
        if (!formatId) {
          this.fileError.set('Selecciona un formato de enlace.');
          return;
        }
        payload.format_id = formatId;

        const url = this.form.controls.url.value?.trim() || '';
        if (url) payload.url = url;

        const urlInsert = this.form.controls.url_insert.value?.trim() || '';
        if (urlInsert) payload.url_insert = urlInsert;

        const durationStr = this.form.controls.duration_str.value?.trim() || '';
        if (durationStr) payload.duration_seconds = this.timeStrToSec(durationStr);

        const sizeValue = this.form.controls.size_value.value;
        if (sizeValue) {
          const unit = this.form.controls.size_unit.value || 'MB';
          payload.size_bytes = this.valueUnitToBytes(sizeValue, unit);
        }
      } else if (this.isArchiveType()) {
        const file = this.fileSel();
        if (!file) {
          this.fileError.set('Selecciona un archivo para subir.');
          return;
        }

        // Detectar formato basado en extensión o MIME
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const archiveType = this.types().find(t => t.name.toLowerCase() === ARCHIVE_TYPE);
        let fmt: FormatItem | null = null;
        for (const f of archiveType?.formats ?? []) {
          const fName = f.name.toLowerCase();
          if (fName === ext) {
            fmt = f;
            break;
          } else if (fName === 'video' && file.type.startsWith('video/')) {
            fmt = f;
            break;
          } else if (fName === 'audio' && file.type.startsWith('audio/')) {
            fmt = f;
            break;
          }
        }
        if (!fmt) {
          this.fileError.set(`Formato ".${ext}" no válido.`);
          return;
        }
        payload.format_id = fmt.id;
        payload.file = file;
        payload.name = file.name;
        payload.size_bytes = file.size;

        const durationStr = this.form.controls.duration_str.value?.trim();
        if (durationStr) payload.duration_seconds = this.timeStrToSec(durationStr);
      }

      const res = await firstValueFrom(
        this.chapterSrv.updateLearningContent(this.getChapterParam(), payload as LearningContentUpdate)
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
        e?.file?.[0] ?? e?.format_id?.[0] ?? e?.url?.[0] ?? err?.error?.message ?? 'No se pudo guardar.'
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

  private extractYouTubeId(raw: string): string | null {
    if (!raw) return null;
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const host = url.hostname.replace(/^www\./i, '').toLowerCase();

      if (host === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0];
        return this.isValidYtId(id) ? id : null;
      }
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const p = url.pathname.toLowerCase();
        const v = url.searchParams.get('v');
        if (v && this.isValidYtId(v)) return v;
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

  // ── Google Drive Helper ──────────────────────────────────────────────────────
  private convertGoogleDriveUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('drive.google.com')) {
        const fileId = urlObj.searchParams.get('id') || urlObj.pathname.split('/d/')[1]?.split('/')[0];
        if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      if (urlObj.hostname.includes('docs.google.com')) {
        const docId = urlObj.pathname.split('/d/')[1]?.split('/')[0];
        if (docId) {
          const type = urlObj.pathname.includes('/document/') ? 'document'
                     : urlObj.pathname.includes('/presentation/') ? 'presentation'
                     : urlObj.pathname.includes('/spreadsheets/') ? 'spreadsheets'
                     : '';
          if (type) return `https://docs.google.com/${type}/d/${docId}/preview`;
        }
      }
    } catch { /* */ }
    return url;
  }

  // ── OneDrive Helper ──────────────────────────────────────────────────────────
  private extractOneDriveSrc(input: string): string | null {
    // Si es un link directo, devolverlo
    if (input.startsWith('https://') && !input.includes('<')) return input;
    // Extraer de <iframe src="...">
    const iframeMatch = input.match(/<iframe[^>]*src="([^"]+)"/);
    if (iframeMatch) return iframeMatch[1];
    // Extraer de <img src="...">
    const imgMatch = input.match(/<img[^>]*src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];
    return null;
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
    const mime = formatName ? this.mimeFromFormat(formatName) : undefined;
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

  private detectPreviewType(name: string, mime?: string): 'video' | 'audio' | 'pdf' | 'other' {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (mime?.startsWith('video/') || ['mp4','webm','ogg','mkv','mov'].includes(ext)) return 'video';
    if (mime?.startsWith('audio/') || ['mp3','wav','aac','flac'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  }

  private mimeFromFormat(fmt: string): string | undefined {
    const m: Record<string, string> = {
      mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
      pdf: 'application/pdf',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp',
    };
    return m[fmt.toLowerCase()];
  }

  private getMediaDuration(file: File): Promise<number | null> {
    return new Promise<number | null>(resolve => {
      const url = URL.createObjectURL(file);
      const el = file.type.startsWith('audio/')
        ? document.createElement('audio')
        : document.createElement('video');
      el.preload = 'metadata';
      el.src = url;
      el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(el.duration || null); };
      el.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    });
  }

  // ── Conversiones de unidades ─────────────────────────────────────────────────
  private bytesToValueUnit(bytes: number): { value: number; unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB' } {
    const units: Array<'B' | 'KB' | 'MB' | 'GB' | 'TB'> = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return { value: Math.round(value * 100) / 100, unit: units[i] };
  }

  private valueUnitToBytes(value: number, unit: string): number {
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 ** 2,
      'GB': 1024 ** 3,
      'TB': 1024 ** 4,
    };
    return Math.round(value * (multipliers[unit] || 1024 ** 2));
  }

  private timeStrToSec(timeStr: string): number {
    const parts = timeStr.trim().split(':').map(p => parseInt(p, 10)).filter(n => !isNaN(n));
    if (parts.length === 2) {
      const [mm, ss] = parts;
      return mm * 60 + ss;
    }
    if (parts.length === 3) {
      const [hh, mm, ss] = parts;
      return hh * 3600 + mm * 60 + ss;
    }
    return 0;
  }

  private secToTimeStr(sec: number): string {
    const hh = Math.floor(sec / 3600);
    const mm = Math.floor((sec % 3600) / 60);
    const ss = sec % 60;
    if (hh > 0) {
      return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }
    return `${mm}:${String(ss).padStart(2, '0')}`;
  }

  private clearFormFields(): void {
    this.form.controls.url.setValue(null, { emitEvent: false });
    this.form.controls.url_insert.setValue(null, { emitEvent: false });
    this.form.controls.name.setValue(null, { emitEvent: false });
    this.form.controls.size_value.setValue(null, { emitEvent: false });
    this.form.controls.size_unit.setValue('MB', { emitEvent: false });
    this.form.controls.duration_str.setValue(null, { emitEvent: false });
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
    const s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(i === 0 ? 0 : 1)} ${s[i]}`;
  }

  secToMin(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }
}