// file-upload.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnChanges, forwardRef, HostListener, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { UiFileUploadDirective } from '../../../directive/ui-file-upload.directive';
import { UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
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
    // Re-exportamos TODOS los inputs para usarlos como <ui-file-upload ...>
    inputs: [
      'alt','type','variant','position','label','urlMiniature',
      'severity','size','disabled','invalid',
      'btnClass','btnStyle',
      'ariaLabel','role','tabIndex','ariaPressed','title',
      'svgPath','iconClass','iconStyle',
      'fudClass','fudStyle'
    ],
    
  }]
})
export class FileUploadComponent implements ControlValueAccessor, Validator, OnChanges {

  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);

  // La instancia de la directiva para leer inputs actuales
  constructor(public readonly fud: UiFileUploadDirective) {
    // mantener comportamiento coherente con tu ButtonComponent
    /* this.ngOnChanges(); */
  }

  /** ======= ControlValueAccessor ======= */
  private _onChange: (value: File | null) => void = () => {};
  private _onTouched: () => void = () => {};

  value: File | null = null ;
  previewUrl?: SafeUrl;          // para imagen/video
  isDropHover = false;           // estado drag-over
  isModalOpen = false;           // modal de previsualización grande
  inputId = `fu_${Math.random().toString(36).slice(2)}`;

  writeValue(file: File | null): void {
    this.value = file ?? null;
    this.updatePreview();
  }
  registerOnChange(fn: (value: File | null) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.fud.disabled = isDisabled; }

  /** ======= Validator ======= */
  validate(_: AbstractControl): ValidationErrors | null {
    if (this.fud.invalid) return { invalid: true };
    return null;
  }

  /** ======= Ciclo ======= */
  ngOnChanges(): void {
    // nada obligatorio aquí por ahora; se deja para futuro (p.ej. precarga de ícono)
    this.updatePreview();
  }

  /** ======= Manejo de archivos ======= */
  acceptAttr(): string {
    const t = this.fud.type ?? 'image';
    if (t === 'image') return 'image/*';
    if (t === 'document')   return 'application/pdf';
    if (t === 'video') return 'video/*';
    return '*/*';
  }

  onInputChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setFile(file);
  }

  setFile(file: File | null) {
    this.value = file;
    this._onChange(this.value);
    this.updatePreview();
  }

  clearFile(ev?: MouseEvent) {
    ev?.preventDefault();
    if (this.fud.disabled) return;
    this.value = null;
    this._onChange(null);
    this.updatePreview();
  }

  private updatePreview() {
    // liberar URL anterior si existe (buena práctica)
    this.previewUrl = undefined;
    const t = (this.fud.type ?? 'image');

    if (!this.value) {
      // Fallback a urlMiniature (solo tiene sentido para image/video)
      if (this.fud.urlMiniature && (t === 'image' || t === 'video')) {
        this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(this.fud.urlMiniature);
      }
      return;
    }

    const url = URL.createObjectURL(this.value);
    this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(url);
  }

  openModal() {
    if (this.fud.disabled) return;
    this.isModalOpen = true;
  }
  closeModal() { this.isModalOpen = !this.isModalOpen; }

  /** ======= Drag & Drop ======= */
  @HostListener('dragover', ['$event'])
  onDragOver(ev: DragEvent) {
    if (this.fud.disabled) return;
    ev.preventDefault();
    this.isDropHover = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(ev: DragEvent) {
    if (this.fud.disabled) return;
    ev.preventDefault();
    this.isDropHover = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(ev: DragEvent) {
    if (this.fud.disabled) return;
    ev.preventDefault();
    this.isDropHover = false;

    const file = ev.dataTransfer?.files?.[0] ?? null;
    if (!file) return;

    // filtra por tipo
    const t = this.fud.type ?? 'image';
    if (t === 'image' && !file.type.startsWith('image/')) return;
    if (t === 'video' && !file.type.startsWith('video/')) return;
    if (t === 'document'   && file.type !== 'application/pdf') return;

    this.setFile(file);
    this._onTouched();
  }

  /** ======= A11y: Enter / Space ======= */
  
  triggerBrowse(ev?: Event) {
    ev?.preventDefault();
    document.getElementById(this.inputId)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  /** ======= Estilos (tokens CSS) ======= */
  private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      dropH:  s === 'sm' ? '88px'  : s === 'lg' ? '140px' : '110px',
      pad:    s === 'sm' ? '8px'   : s === 'lg' ? '14px'  : '10px',
      gap:    s === 'sm' ? '6px'   : s === 'lg' ? '12px'  : '8px',
      font:   s === 'sm' ? '12px'  : s === 'lg' ? '14px'  : '13px',
      radius: s === 'sm' ? '6px'   : s === 'lg' ? '10px'  : '8px',
      previewWidth: '300px'
    };
  }
  private cssVars(): Record<string, string> {
    const sev: UiSeverity = (this.fud.severity as UiSeverity) ?? 'primary';
    const st = this.sizeTokens(this.fud.size as UiSize);
    const sevBg = `var(--sev-${sev})`;
    const sevBgHover = `var(--sev-${sev}-hover, ${sevBg})`;

    return {
      '--fu-pad': st.pad,
      '--fu-gap': st.gap,
      '--fu-font': st.font,
      '--fu-radius': st.radius,
      '--fu-drop-h': st.dropH,
      '--fu-accent': sevBg,
      '--fu-accent-hover': sevBgHover,
      '--fu-border': 'var(--border-color)',
      '--fu-overlay': 'var(--overlay-color)',
      '--fu-shadow': 'var(--shadow-color)',
      '--fu-preview-w': st.previewWidth
    };
  }
  styleMap(): Record<string, string> {
    const base = this.cssVars();
    const overrides = styleToNgStyle(this.fud.fudStyle);
    return mergeStyles(base, overrides);
  }
  hostClasses(): string[] {
    const v = `v-${this.fud.variant ?? 'filled'}`;
    const s = `s-${this.fud.size ?? 'md'}`;
    const pos = `label-${this.fud.position ?? 'top'}`;
    const dis = this.fud.disabled ? 'is-disabled' : '';
    const inv = this.fud.invalid ? 'is-invalid' : '';
    const extra = this.fud.fudClass ?? '';
    return ['fu-root', v, s, pos, dis, inv, extra].filter(Boolean);
  }
}

