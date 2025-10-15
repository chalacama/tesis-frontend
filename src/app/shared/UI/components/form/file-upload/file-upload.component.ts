import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, OnDestroy, OnInit, signal, computed, inject, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { UiFileUploadDirective } from '../../../directive/ui-file-upload.directive';
import { UiFileFormat, UiFileType, UiFileFormats, UiNeumorphism, UiSeverity, UiSize, UiVariant } from '../../../interfaces/ui-presets.interface';
import { UiButtonProps } from '../../../interfaces/ui-button.interface';
import { UiIconProps } from '../../../interfaces/ui-icon.interface';
import { ButtonComponent } from '../../button/button/button.component';
import { IconComponent } from '../../button/icon/icon.component';
// Asumiendo selector 'ui-preview' ya existe en tu lib
import { Component as NgComponent } from '@angular/core'; // para evitar conflicto de nombre local
import { DomSanitizer } from '@angular/platform-browser';
import { PreviewComponent } from '../../media/preview/preview.component';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent , PreviewComponent],
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
      'severity','size','disabled','neumorphism','variant','invalid',
      'ariaLabel','role','tabIndex','ariaPressed','title',
      // === Propios del FileUpload
      'id','types','formats','orientation','label','class','style',
      'clearbtn','icon','max','min','maxMb','minSecond','maxSecond','preview' ,
    ],
    outputs: ['fileSelected']

  }]
})
export class FileUploadComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  // 1) NUEVO: permite vacíos sin invalidar
@Input() allowEmpty = true;

  constructor(public readonly fud: UiFileUploadDirective) {}
  

  // ======= STATE =======
  /** Archivos seleccionados (controlado internamente, pero refleja el valor del form) */
  files: File[] = [];
  /** Previews para imágenes */
  /* previews: {file: File; url?: string; type: UiFileType; duration?: number}[] = []; */
  previews: { file?: File; url: string | '' ; type: UiFileType; duration?: number; from: 'file'|'url'; name: string }[] = [];
  /** Errores de validación acumulados */
  errors: string[] = [];

   isDragOver = false;

  private onChange: (value: File[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  // ======= LIFECYCLE =======
  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.revokeAll();
  }

  // ======= VALUE ACCESSOR =======

  registerOnChange(fn: (value: File[] | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.fud.disabled = isDisabled; }
 @Input() required = false;
  // ======= VALIDATOR =======
  // 2) Modifica validate(...) para que '' sea válido si allowEmpty === true
validate(control: AbstractControl): ValidationErrors | null {
  // Si se permite vacío y el valor actual es '' o null, es válido
  const raw = control?.value;
  if (this.allowEmpty && (raw === '' || raw == null)) {
    this.errors = [];            // limpia cualquier rastro visual de error
    return null;                 // NO invalida el control
  }

  const urlCount = this.previews.filter(p => p.from === 'url').length;
  const fileCount = this.files.length;
  const total = urlCount + fileCount;

  const minDefault = this.required ? 1 : 0;
  const min = this.num(this.fud.min, minDefault);
  const max = this.num(this.fud.max, 1);

  const errs: string[] = [];
  if (total < min) errs.push(`Debes seleccionar al menos ${min} archivo(s).`);
  if (max && total > max) errs.push(`Solo se permiten ${max} archivo(s).`);

  errs.push(...this.validateSync(this.files, { min, max }));

  const asyncErrs = this.errors.filter(e => e.startsWith('Duración'));
  const all = [...errs, ...asyncErrs];

  return all.length ? { fileUpload: all } : null;
}


  // ======= UI COMPUTEDS =======
  acceptAttr(): string {
    const { types, formats } = this.fud;
    // 1) Si formats explícitos => usar esos (e.g., ['jpg','png'])
    // 2) Si solo types => mapear via UiFileFormats
    // 3) Si nada => aceptar todo
    const final: string[] = [];

    if (formats?.length) {
      formats.forEach(f => final.push('.' + f));
    } else if (types?.length) {
      types.forEach(t => {
        (UiFileFormats[t] || []).forEach(ext => final.push('.' + ext));
      });
    }

    // Para video/pdf también agregamos MIME amplios si sólo hay tipo
    if (!formats?.length && types?.includes('video')) final.push('video/*');
    if (!formats?.length && types?.includes('image')) final.push('image/*');
    if (!formats?.length && types?.includes('document')) final.push('application/pdf');

    return final.length ? Array.from(new Set(final)).join(',') : '';
  }

  

  async clearAll() {
    if (this.fud.disabled) return;
    this.clearInternal();
    this.propagate();
  }

  // ======= CORE VALIDATION =======
  private async validateAll(files: File[]) {
    const errors: string[] = [];

    // Conteo
    const min = this.num(this.fud.min, 1);
    const max = this.num(this.fud.max, 1);
    if (files.length < min) errors.push(`Debes seleccionar al menos ${min} archivo(s).`);
    if (files.length > max) errors.push(`Solo se permiten ${max} archivo(s).`);

    // Por archivo: extensión/tipo y tamaño
    const types = this.fud.types || [];
    const formats = this.fud.formats || [];
    const allowed = formats.length
      ? new Set(formats.map(f => f.toLowerCase()))
      : new Set(types.flatMap(t => UiFileFormats[t] || []).map(f => f.toLowerCase()));

    const maxMb = this.num(this.fud.maxMb);
    const minSec = this.num(this.fud.minSecond);
    const maxSec = this.num(this.fud.maxSecond);

    for (const f of files) {
      const ext = this.ext(f.name);
      if (allowed.size && !allowed.has(ext)) {
        errors.push(`El archivo "${f.name}" no cumple el formato permitido (${Array.from(allowed).join(', ')}).`);
      }

      if (maxMb && f.size > maxMb * 1024 * 1024) {
        errors.push(`"${f.name}" excede el tamaño máximo de ${maxMb} MB.`);
      }
    }

    // Validación de duración (solo si está configurado y hay videos)
    const needsDuration = (minSec || maxSec) && this.inferTypeFromAllowed(allowed) === 'video';
    if (needsDuration) {
      for (const f of files) {
        // Consideramos videos por extensión permitida 'mp4'
        if (/\.(mp4)$/i.test(f.name)) {
          const dur = await this.getVideoDuration(f).catch(() => -1);
          if (dur < 0) {
            errors.push(`No fue posible leer la duración de "${f.name}".`);
          } else {
            if (minSec && dur < minSec) errors.push(`Duración de "${f.name}" menor a ${minSec}s.`);
            if (maxSec && dur > maxSec) errors.push(`Duración de "${f.name}" mayor a ${maxSec}s.`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateSync(files: File[], opts?: { min?: number; max?: number }): string[] {
  const errs: string[] = [];
  const min = opts?.min ?? this.num(this.fud.min, this.required ? 1 : 0);
  const max = opts?.max ?? this.num(this.fud.max, 1);

  // OJO: aquí validamos SOLO files. El mínimo real ya se chequeó en validate()
  if (max && files.length > max) errs.push(`Solo se permiten ${max} archivo(s).`);
  return errs;
}


  // ======= PREVIEWS =======
  private async syncPreviews() {
    // limpiar URLs viejas
    this.revokeAll();
    this.previews = [];

    const allowedTypes = this.fud.types || [];
    for (const f of this.files) {
      const type = this.inferTypeByNameOrMime(f, allowedTypes);
      if (type === 'image') {
        const url = URL.createObjectURL(f);
        // this.previews.push({ file: f, url, type, });
        this.previews.push({ file: f, url, type, from: 'file', name: f.name });
      } else if (type === 'video') {
        const duration = await this.getVideoDuration(f).catch(() => undefined);
        // this.previews.push({ file: f, type, duration });
        this.previews.push({ file: f, url: URL.createObjectURL(f), type, duration, from: 'file', name: f.name });
      } else {
        // this.previews.push({ file: f, type: 'document' });
        this.previews.push({ file: f, url: '', type: 'document', from: 'file', name: f.name });
      }
    }
  }

  private revokeAll() {
    this.previews.forEach(p => p.url && URL.revokeObjectURL(p.url));
  }

  // ======= HELPERS =======
  private ext(name: string): UiFileFormat | string {
    const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
    return (m ? m[1] : '').toLowerCase();
  }
  public num(v: number | string | undefined, _default?: number): number {
    if (v === '' || v == null) return _default ?? 0;
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? (n as number) : (_default ?? 0);
  }

  private inferTypeByNameOrMime(f: File, fallback: UiFileType[]): UiFileType {
    const name = f.name.toLowerCase();
    if (/\.(jpg|jpeg|png|gif)$/i.test(name) || f.type.startsWith('image/')) return 'image';
    if (/\.(mp4)$/i.test(name) || f.type.startsWith('video/')) return 'video';
    return fallback[0] || 'document';
  }

  private inferTypeFromAllowed(allowed: Set<string>): UiFileType | undefined {
    if (allowed.has('jpg') || allowed.has('png') || allowed.has('gif')) return 'image';
    if (allowed.has('mp4')) return 'video';
    if (allowed.has('pdf')) return 'document';
    return undefined;
    }

  private getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      const cleanup = () => { URL.revokeObjectURL(url); video.src = ''; };
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const dur = video.duration;
        cleanup();
        if (isFinite(dur)) resolve(dur);
        else reject(new Error('invalid-duration'));
      };
      video.onerror = () => { cleanup(); reject(new Error('load-error')); };
      video.src = url;
    });
  }

  private clearInternal(revoke = true) {
    this.files = [];
    if (revoke) this.revokeAll();
    this.previews = [];
    this.errors = [];
  }

  /* private propagate() {
    this.onChange(this.files.length ? this.files : null);
  } */

  // Para fallback rápido si no pasan label
  defaultLabel(): string {
    if (this.fud.label && this.fud.label.trim().length) return this.fud.label!;
    const sev: UiSeverity = (this.fud.severity as UiSeverity) ?? 'primary';
    // Texto por defecto contextual
    return 'Suelta o selecciona archivos';
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
    return this.fud.icon ?? { svgPath: 'svg/upload-outline.svg', size: this.fud.size ?? 'sm', severity: this.fud.severity ?? 'primary' };
  }

  // ======= DINÁMICO: clases host (ya lo tenías) + estilos con CSS vars =======
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

  /** === NUEVO ===: tokens por tamaño (para paddings/gaps/ícono) */
  private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      pad:  s === 'sm' ? '8px'  : s === 'lg' ? '16px' : '12px',
      gap:  s === 'sm' ? '8px'  : s === 'lg' ? '14px' : '12px',
      icon: s === 'sm' ? '40px' : s === 'lg' ? '72px' : '60px',
      radius: s === 'sm' ? '8px' : s === 'lg' ? '12px' : '10px',
      font: s === 'sm' ? '.85rem' : s === 'lg' ? '1rem' : '.95rem'
    };
  }

  /** === NUEVO ===: variables CSS en función de severity/variant/neumorphism */
  private cssVars(): Record<string, string> {
    const sev: UiSeverity = (this.fud.severity as UiSeverity) ?? 'primary';
    const v: UiVariant    = (this.fud.variant   as UiVariant)   ?? 'filled';
    const sizeTok         = this.sizeTokens(this.fud.size as UiSize);

    // tokens de color severidad
    const sevBg       = `var(--sev-${sev})`;
    const sevHover    = `var(--sev-${sev}-hover, ${sevBg})`;
    const borderColor = `var(--sev-${sev})`;
    const fg          = (sev === 'secondary') ? 'var(--text-color, #111)' : 'var(--text-color-contrast, #fff)';

    // danger para estado inválido
    const dangerBorder = `var(--sev-danger)`;
    const dangerHover  = `var(--sev-danger-hover, ${dangerBorder})`;

    // neumorphism (sombras)
    const shadow      = '2px 4px 8px';
    const shadowC     = 'rgba(0,0,0,.25)';
    const shadowL     = 'rgba(255,255,255,.25)';

    // variantes para el área drop
    let areaBg   = `color-mix(in oklab, var(--card-bg) 92%, transparent)`;
    let areaBd   = borderColor;
    let areaFg   = `var(--text-color)`;

    if (v === 'filled') {
      areaBg = `color-mix(in oklab, ${sevBg} 14%, var(--card-bg))`;
      areaFg = `var(--text-color)`;
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

      '--ufu-danger-bd': dangerBorder,
      '--ufu-danger-hover-bd': dangerHover,

      '--ufu-shadow': shadow,
      '--ufu-shadow-c': shadowC,
      '--ufu-shadow-l': shadowL,

      // color de ícono por defecto en el área
      '--ufu-border-color': borderColor
    };
  }

  /** === NUEVO ===: mezcla de cssVars con fudStyle del usuario */
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
    if (!dt) return;

    const dropped = Array.from(dt.files || []);
    if (!dropped.length) return;

    // aplicar max
    const max = this.num(this.fud.max, 1);
    const combined = [...this.files, ...dropped].slice(0, max);

    const { valid, errors } = await this.validateAll(combined);
    this.errors = errors;

    if (valid) {
      this.files = combined;
      await this.syncPreviews();
      this.propagate();
    }
    this.onTouched();
  }
// =======Nuevo Mantenimiento======

// ======= VALUE ACCESSOR =======
writeValue(value: string | string[] | File | File[] | null): void {
  this.clearInternal(false);

  if (!value) {
    this.previews = [];
    return;
  }

  // Normaliza a lista
  const list = Array.isArray(value) ? value : [value];

  // Si viene File / File[]
  if (list[0] instanceof File) {
    this.files = (list as File[]);
    void this.syncPreviewsFromFiles();
    return;
  }

  // Si viene string / string[]
  const urls = list as string[];
  this.previews = urls
    .filter(u => typeof u === 'string' && u.trim().length)
    .map(u => {
      const type = this.inferTypeFromUrl(u) ?? (this.fud.types?.[0] ?? 'image');
      const name = this.nameFromUrl(u);
      return { url: u, type, from: 'url', name };
    });
}

// ======= HANDLERS =======
async onFileInputChange(ev: Event) {
  if (this.fud.disabled) return;
  const input = ev.target as HTMLInputElement;
  const list = input.files ? Array.from(input.files) : [];

  const max = this.num(this.fud.max, 1);

  // Si cargas nuevos archivos y max=1, lo usual es reemplazar URLs previas
  // (ajústalo a tus reglas si quieres acumular)
  if (max === 1) {
    this.previews = this.previews.filter(p => p.from === 'file'); // quita urls
  }

  const combined = [...this.files, ...list].slice(0, max);
  const { valid, errors } = await this.validateAll(combined);
  this.errors = errors;

  if (valid) {
    /* this.files = combined;
    await this.syncPreviewsFromFiles(true); // true => limpia previews URL si hay files nuevos
    this.propagate(); */
    this.files = combined;
  await this.syncPreviewsFromFiles(true);
  this.fud.fileSelected.emit(this.files[0] ?? null);
  this.propagate();
  }

  input.value = '';
  this.onTouched();
}

async removeAt(idx: number) {
  if (this.fud.disabled) return;
  const item = this.previews[idx];
  if (!item) return;

  // Si vino de archivos, quítalo de files
  if (item.from === 'file') {
    const fIndex = this.files.findIndex(f => f.name === item.name && item.file === f);
    if (fIndex > -1) this.files.splice(fIndex, 1);
  }

  // Quita del preview
  const [removed] = this.previews.splice(idx, 1);
  if (removed?.url && removed.file) URL.revokeObjectURL(removed.url);

  // Reconstruye previews desde files (para recalcular duraciones)
  await this.syncPreviewsFromFiles(false);

  this.propagate();
}

// ======= PREVIEWS =======
private async syncPreviewsFromFiles(clearUrlPreviews = false) {
  // Limpia objectURL previos de file
  this.previews
    .filter(p => p.from === 'file' && p.url)
    .forEach(p => URL.revokeObjectURL(p.url));

  if (clearUrlPreviews) {
    // Borra entradas from=url si llegó un file nuevo (caso max=1 típico)
    this.previews = this.previews.filter(p => p.from === 'file') ;
  } else {
    // Conserva las URL existentes, pero sin duplicar
    this.previews = this.previews.filter(p => p.from === 'url');
  }

  const allowedTypes = this.fud.types || [];
  for (const f of this.files) {
    const type = this.inferTypeByNameOrMime(f, allowedTypes);
    const name = f.name;
    if (type === 'image' || type === 'video' || type === 'document') {
      const url = URL.createObjectURL(f);
      const item: { file?: File; url: string; type: UiFileType; duration?: number; from: 'file'|'url'; name: string } = {
        file: f, url, type, from: 'file', name
      };
      if (type === 'video') {
        item.duration = await this.getVideoDuration(f).catch(() => undefined);
      }
      this.previews.push(item);
    }
  }
}

// ======= OUTPUT =======
// 3) Modifica propagate() para emitir '' (o []) en lugar de null cuando no hay selección
private propagate() {
  const isSingle = this.num(this.fud.max, 1) === 1;

  if (this.files.length) {
    this.onChange(this.files);
    return;
  }

  const urlValues = this.previews.filter(p => p.from === 'url').map(p => p.url);

  if (urlValues.length === 0) {
    // Si se permite vacío, mantenemos '' (o []) para no disparar validaciones de "valor nulo"
    if (this.allowEmpty) {
      this.onChange((isSingle ? '' : []) as any);
    } else {
      this.onChange(null);
    }
    return;
  }

  this.onChange((isSingle ? urlValues[0] : urlValues) as any);
}


// ======= HELPERS =======
private inferTypeFromUrl(u: string): UiFileType | undefined {
  const ext = (u.split('?')[0] || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
  if (/(jpg|jpeg|png|gif)$/.test(ext)) return 'image';
  if (/(mp4)$/.test(ext)) return 'video';
  if (/(pdf)$/.test(ext)) return 'document';
  return undefined;
}
private nameFromUrl(u: string): string {
  try {
    const path = (u.split('?')[0] || '').split('/').pop() || 'archivo';
    return decodeURIComponent(path);
  } catch { return 'archivo'; }
}
}
