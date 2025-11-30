import { CommonModule } from '@angular/common';
import {
  Component,
  forwardRef,
  Input,
  OnDestroy
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { UiFileUploadDirective } from '../../../directive/ui-file-upload.directive';
import {
  UiSeverity,
  UiSize,
  UiVariant
} from '../../../interfaces/ui-presets.interface';
import { UiButtonProps } from '../../../interfaces/ui-button.interface';
import { UiIconProps } from '../../../interfaces/ui-icon.interface';
import { ButtonComponent } from '../../button/button/button.component';
import { IconComponent } from '../../button/icon/icon.component';
import { PreviewComponent } from '../../media/preview/preview.component';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';

interface ImagePreviewItem {
  file?: File;
  url: string;
  from: 'file' | 'url';
  name: string;
  sizeLabel?: string;
}

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, PreviewComponent],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    }
  ],
  hostDirectives: [{
    directive: UiFileUploadDirective,
    inputs: [
      // === UiFormProps / UiA11Props
      'severity', 'size', 'disabled', 'neumorphism', 'variant', 'invalid',
      'ariaLabel', 'role', 'tabIndex', 'ariaPressed', 'title',
      // === Propios del FileUpload
      'id', 'types', 'formats', 'orientation', 'label', 'class', 'style',
      'clearbtn', 'icon', 'max', 'min', 'maxMb', 'minSecond', 'maxSecond', 'preview',
    ],
    outputs: ['fileSelected']
  }]
})
export class FileUploadComponent implements ControlValueAccessor, Validator, OnDestroy {

  /** Permitir vacío sin invalidar el control */
  @Input() allowEmpty = true;
  /** Marcar como requerido (mínimo 1 imagen) */
  @Input() required = false;

  constructor(public readonly fud: UiFileUploadDirective) { }

  // ======= STATE =======
  /** Archivos seleccionados */
  files: File[] = [];
  /** Previews (file o url) */
  previews: ImagePreviewItem[] = [];
  /** Errores de validación */
  errors: string[] = [];
  /** Estado visual drag & drop */
  isDragOver = false;

  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };

  // ======= LIFECYCLE =======
  ngOnDestroy(): void {
    this.revokeAll();
  }

  // ======= VALUE ACCESSOR =======
  registerOnChange(fn: (value: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.fud.disabled = isDisabled; }

  writeValue(value: string | string[] | File | File[] | null): void {
    this.clearInternal(false);

    if (!value) {
      this.previews = [];
      return;
    }

    // Normaliza
    const list = Array.isArray(value) ? value : [value];

    // Si viene File / File[]
    if (list[0] instanceof File) {
      this.files = list as File[];
      void this.syncPreviewsFromFiles(true);
      return;
    }

    // Si viene string / string[] (URLs)
    const urls = list as string[];
    this.previews = urls
      .filter(u => typeof u === 'string' && u.trim().length && this.isImageUrl(u))
      .map(u => ({
        url: u,
        from: 'url' as const,
        name: this.nameFromUrl(u)
      }));
  }

  // ======= VALIDATOR =======
  validate(control: AbstractControl): ValidationErrors | null {
    const raw = control?.value;
    if (this.allowEmpty && (raw === '' || raw == null)) {
      this.errors = [];
      return null;
    }

    const minDefault = this.required ? 1 : 0;
    const min = this.num(this.fud.min, minDefault);
    const max = this.num(this.fud.max, 1);

    const errs: string[] = [];

    const totalCount = this.previews.length;
    if (totalCount < min) {
      errs.push(`Debes seleccionar al menos ${min} imagen${min > 1 ? 'es' : ''}.`);
    }
    if (max && totalCount > max) {
      errs.push(`Solo se permiten ${max} imagen${max > 1 ? 'es' : ''}.`);
    }

    // Validaciones por archivo (formato/tamaño)
    errs.push(...this.validateFiles(this.files, { skipCount: true, min, max }));

    this.errors = errs;
    return errs.length ? { fileUpload: errs } : null;
  }

  // ======= HELPERS DE VALIDACIÓN =======
  private validateFiles(
    files: File[],
    opts: { min?: number; max?: number; skipCount?: boolean } = {}
  ): string[] {
    const errs: string[] = [];
    const min = opts.min ?? this.num(this.fud.min, this.required ? 1 : 0);
    const max = opts.max ?? this.num(this.fud.max, 1);

    if (!opts.skipCount) {
      if (files.length < min) {
        errs.push(`Debes seleccionar al menos ${min} imagen${min > 1 ? 'es' : ''}.`);
      }
      if (max && files.length > max) {
        errs.push(`Solo se permiten ${max} imagen${max > 1 ? 'es' : ''}.`);
      }
    }

    const formatList = (this.fud.formats || []) as string[];
    const allowedExts = formatList.length
      ? new Set(formatList.map(f => f.toLowerCase()))
      : new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']);

    const maxMb = this.num(this.fud.maxMb);

    const allowedText = Array.from(allowedExts).join(', ') || 'jpg, jpeg, png, webp, avif';

    for (const f of files) {
      const ext = this.ext(f.name);
      const isImageMime = !!f.type && f.type.startsWith('image/');
      const isAllowedExt = allowedExts.size ? allowedExts.has(ext) : true;

      if (!isImageMime || !isAllowedExt) {
        errs.push(`"${f.name}" no es una imagen válida. Formatos permitidos: ${allowedText}.`);
      }

      if (maxMb && f.size > maxMb * 1024 * 1024) {
        errs.push(`"${f.name}" excede el tamaño máximo de ${maxMb} MB.`);
      }
    }

    return errs;
  }

  // ======= PUBLIC API =======
  async clearAll() {
    if (this.fud.disabled) return;
    this.clearInternal();
    this.propagate();
    this.onTouched();
  }

  // ======= UI COMPUTEDS =======
  /** Sólo imágenes (y opcionalmente extensiones específicas) */
  acceptAttr(): string {
    const formats = this.fud.formats as string[] | undefined;
    if (formats?.length) {
      return formats.map(f => '.' + f.toLowerCase()).join(',');
    }
    return 'image/*';
  }

  defaultLabel(): string {
    if (this.fud.label && this.fud.label.trim().length) return this.fud.label!;
    return 'Suelta o selecciona una imagen';
  }

  clearBtnProps(): UiButtonProps {
    const cfg = this.fud.clearbtn as UiButtonProps | undefined;
    return {
      label: cfg?.label ?? 'Limpiar',
      severity: cfg?.severity ?? 'danger',
      size: cfg?.size ?? (this.fud.size ?? 'sm'),
      variant: cfg?.variant ?? 'outlined',
      neumorphism: cfg?.neumorphism ?? 'raised',
      icon: cfg?.icon ?? { svgPath: 'svg/close-outline.svg', size: this.fud.size ?? 'sm' }
    };
  }

  uploadIcon(): UiIconProps {
    return this.fud.icon ?? {
      svgPath: 'svg/image.svg',
      size: this.fud.size ?? 'sm',
      severity: this.fud.severity ?? 'primary'
    };
  }

  hostClasses(): string[] {
    const v = `v-${this.fud.variant ?? 'filled'}`;
    const s = `s-${this.fud.size ?? 'md'}`;
    const neu = `neu-${this.fud.neumorphism ?? 'flat'}`;
    const dis = this.fud.disabled ? 'is-disabled' : '';
    const ori = `o-${this.fud.orientation ?? 'vertical'}`;
    const invalid = (this.errors.length > 0 || this.fud.invalid) ? 'is-invalid' : '';
    const drag = this.isDragOver ? 'is-dragover' : '';
    const extra = this.fud.class ?? '';
    return ['ui-file-upload', v, s, neu, ori, dis, invalid, drag, extra].filter(Boolean);
  }

  private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      pad: s === 'sm' ? '8px' : s === 'lg' ? '16px' : '12px',
      gap: s === 'sm' ? '8px' : s === 'lg' ? '14px' : '12px',
      icon: s === 'sm' ? '40px' : s === 'lg' ? '72px' : '60px',
      radius: s === 'sm' ? '8px' : s === 'lg' ? '12px' : '10px',
      font: s === 'sm' ? '.85rem' : s === 'lg' ? '1rem' : '.95rem'
    };
  }

  private cssVars(): Record<string, string> {
    const sev: UiSeverity = (this.fud.severity as UiSeverity) ?? 'primary';
    const v: UiVariant = (this.fud.variant as UiVariant) ?? 'filled';
    const sizeTok = this.sizeTokens(this.fud.size as UiSize);

    const sevBg = `var(--sev-${sev})`;
    const sevHover = `var(--sev-${sev}-hover, ${sevBg})`;
    const borderColor = `var(--sev-${sev})`;

    const shadow = '2px 4px 8px';
    const shadowC = 'rgba(0,0,0,.25)';
    const shadowL = 'rgba(255,255,255,.25)';

    let areaBg = `color-mix(in oklab, var(--card-bg) 92%, transparent)`;
    let areaBd = borderColor;
    let areaFg = `var(--text-color)`;

    if (v === 'filled') {
      areaBg = `color-mix(in oklab, ${sevBg} 14%, var(--card-bg))`;
    } else if (v === 'outlined') {
      areaBg = `color-mix(in oklab, var(--card-bg) 96%, transparent)`;
    } else if (v === 'flat') {
      areaBg = `transparent`;
    }

    return {
      '--ufu-radius': sizeTok.radius,
      '--ufu-gap': sizeTok.gap,
      '--ufu-pad': sizeTok.pad,
      '--ufu-font': sizeTok.font,
      '--ufu-icon-size': sizeTok.icon,

      '--ufu-area-bg': areaBg,
      '--ufu-area-bd': areaBd,
      '--ufu-area-fg': areaFg,

      '--ufu-area-hover-bd': sevHover,

      '--ufu-danger-bd': 'var(--sev-danger)',
      '--ufu-danger-hover-bd': 'var(--sev-danger-hover, var(--sev-danger))',

      '--ufu-shadow': shadow,
      '--ufu-shadow-c': shadowC,
      '--ufu-shadow-l': shadowL,

      '--ufu-border-color': borderColor
    };
  }

  styleMap(): Record<string, string> {
    const base = this.cssVars();
    const overrides = styleToNgStyle(this.fud.style);
    return mergeStyles(base, overrides);
  }

  // ======= DnD HANDLERS =======
  onDragOver(ev: DragEvent) {
    if (this.fud.disabled) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(ev: DragEvent) {
    if (this.fud.disabled) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver = false;
  }

  async onDrop(ev: DragEvent) {
    if (this.fud.disabled) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver = false;

    const dt = ev.dataTransfer;
    if (!dt?.files?.length) return;

    const dropped = Array.from(dt.files);
    const images = dropped.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;

    const max = this.num(this.fud.max, 1);

    if (max === 1) {
      this.files = [];
      // limpiamos previews de file previas
      this.previews
        .filter(p => p.from === 'file' && p.url)
        .forEach(p => URL.revokeObjectURL(p.url));
    }

    const combined = [...this.files, ...images].slice(0, max);
    const errors = this.validateFiles(combined, { max });
    this.errors = errors;

    if (!errors.length) {
      this.files = combined;
      await this.syncPreviewsFromFiles(max > 1);
      this.fud.fileSelected.emit(this.files[0] ?? null);
      this.propagate();
    }

    this.onTouched();
  }

  // ======= INPUT CHANGE =======
  async onFileInputChange(ev: Event) {
    if (this.fud.disabled) return;
    const input = ev.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];
    if (!list.length) return;

    const max = this.num(this.fud.max, 1);
    const images = list.filter(f => f.type.startsWith('image/'));
    if (!images.length) {
      this.errors = ['Solo se permiten archivos de imagen.'];
      input.value = '';
      this.onTouched();
      return;
    }

    if (max === 1) {
      this.files = [];
      this.previews
        .filter(p => p.from === 'file' && p.url)
        .forEach(p => URL.revokeObjectURL(p.url));
    }

    const combined = [...this.files, ...images].slice(0, max);
    const errors = this.validateFiles(combined, { max });
    this.errors = errors;

    if (!errors.length) {
      this.files = combined;
      await this.syncPreviewsFromFiles(max > 1);
      this.fud.fileSelected.emit(this.files[0] ?? null);
      this.propagate();
    }

    input.value = '';
    this.onTouched();
  }

  // ======= REMOVE =======
  async removeAt(idx: number) {
    if (this.fud.disabled) return;
    const item = this.previews[idx];
    if (!item) return;

    if (item.from === 'file' && item.file) {
      const fIndex = this.files.indexOf(item.file);
      if (fIndex > -1) this.files.splice(fIndex, 1);
      if (item.url) URL.revokeObjectURL(item.url);
    }

    this.previews.splice(idx, 1);
    await this.syncPreviewsFromFiles(true);
    this.propagate();
    this.onTouched();
  }

  // ======= PREVIEWS =======
  private async syncPreviewsFromFiles(preserveUrlPreviews = false) {
    // Limpia object URLs previos
    this.previews
      .filter(p => p.from === 'file' && p.url)
      .forEach(p => URL.revokeObjectURL(p.url));

    const urlPreviews = preserveUrlPreviews
      ? this.previews.filter(p => p.from === 'url')
      : [];

    this.previews = [...urlPreviews];

    for (const f of this.files) {
      if (!f.type.startsWith('image/')) continue;

      const url = URL.createObjectURL(f);
      this.previews.push({
        file: f,
        url,
        from: 'file',
        name: f.name,
        sizeLabel: this.readableSize(f.size)
      });
    }
  }

  private revokeAll() {
    this.previews
      .filter(p => p.from === 'file' && p.url)
      .forEach(p => URL.revokeObjectURL(p.url));
  }

  private clearInternal(revoke = true) {
    if (revoke) this.revokeAll();
    this.files = [];
    this.previews = [];
    this.errors = [];
  }

  // ======= PROPAGATE =======
  private propagate() {
    const isSingle = this.num(this.fud.max, 1) === 1;

    if (this.files.length) {
      this.onChange(this.files);
      return;
    }

    const urlValues = this.previews
      .filter(p => p.from === 'url')
      .map(p => p.url);

    if (urlValues.length === 0) {
      if (this.allowEmpty) {
        this.onChange((isSingle ? '' : []) as any);
      } else {
        this.onChange(null);
      }
      return;
    }

    this.onChange((isSingle ? urlValues[0] : urlValues) as any);
  }

  // ======= UTILS =======
  private ext(name: string): string {
    const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
    return (m ? m[1] : '').toLowerCase();
  }

  public num(v: number | string | undefined, _default?: number): number {
    if (v === '' || v == null) return _default ?? 0;
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? (n as number) : (_default ?? 0);
  }

  private readableSize(bytes: number): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(0)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  }

  private isImageUrl(u: string): boolean {
    const ext = (u.split('?')[0] || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
    return /(jpg|jpeg|png|gif|webp|avif)$/.test(ext);
  }

  private nameFromUrl(u: string): string {
    try {
      const path = (u.split('?')[0] || '').split('/').pop() || 'imagen';
      return decodeURIComponent(path);
    } catch {
      return 'imagen';
    }
  }
}
