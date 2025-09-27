import {
  Component, OnChanges, AfterViewInit, ViewChild, ElementRef,
  forwardRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { UiInputLabelDirective } from '../../../directive/ui-input-label.directive';
import { UiSeverity, UiSize, UiVariant } from '../../../interfaces/ui-presets.interface';
/* import { inputLabelVariant } from '../../../interfaces/ui-input-label.interface'; */


@Component({
  selector: 'ui-input-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-label.component.html',
  styleUrls: ['./input-label.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputLabelComponent),
    multi: true
  }],
  hostDirectives: [{
    directive: UiInputLabelDirective,
    inputs: [
      // UiFormProps
      'severity','size','disabled','invalid',
      // UiLabelProps
      'label',
      // Base
      'class','style','placeholder','type','variant','autoSize',
      // Counter
      'max','counter',
      // A11y
      'ariaLabel','role','tabIndex','ariaPressed','title','showCounter'
    ]
  }]
})
export class InputLabelComponent implements ControlValueAccessor, OnChanges, AfterViewInit {

  constructor(public readonly il: UiInputLabelDirective) {
    this.ngOnChanges();
  }

  // ControlValueAccessor
  private _value = '';
  private onChange = (v: string) => {};
  private onTouched = () => {};
  writeValue(v: string | null): void {
    this._value = v ?? '';
    queueMicrotask(() => this.resizeTextarea());
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.il.disabled = isDisabled; }

  // Refs
  @ViewChild('ta') ta?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('inp') inp?: ElementRef<HTMLInputElement>;

  ngOnChanges(): void {
    queueMicrotask(() => this.resizeTextarea());
  }
  /* ngAfterViewInit(): void {
    this.setupTextareaBase();
    this.resizeTextarea();
  } */

  // ===== UI tokens ===== sm
  private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      padY:  s === 'sm' ? '30px' : s === 'lg' ? '36px' : '33px',
      padX:  s === 'sm' ? '12px' : s === 'lg' ? '15px' : '14px',
      font:  s === 'sm' ? '13px' : s === 'lg' ? '15px' : '14px',
      labelFont: s === 'sm' ? '11px' : s === 'lg' ? '12px' : '11px',
      radius: '10px',
      borderWidth: '1px'
    };
  }

  cssVars(): Record<string,string> {
    const sev: UiSeverity = (this.il.severity as UiSeverity) ?? 'primary';
    const s = this.sizeTokens(this.il.size as UiSize);
    const v: UiVariant = (this.il.variant as UiVariant) ?? 'outlined';

    const baseBorder = 'var(--border-color)';
    const active     = `var(--sev-${sev}, var(--active-color))`;
    const activeHv   = `var(--sev-${sev}-hover, var(--active-color))`;
    const txt        = 'var(--text-color)';
    const bg         = 'transparent';

    const borderColor = v === 'outlined' ? baseBorder : 'transparent';
    const fillBg      = v === 'filled'
      ? 'color-mix(in oklab, var(--active-color) 10%, transparent)'
      : bg;

    return {
      '--uil-pad-y': s.padY,
      '--uil-pad-x': s.padX,
      '--uil-font':  s.font,
      '--uil-label-font': s.labelFont,
      '--uil-radius': s.radius,
      '--uil-border': borderColor,
      '--uil-border-width': s.borderWidth,
      '--uil-color': txt,
      '--uil-bg': fillBg,
      '--uil-focus': active,
      '--uil-focus-hover': activeHv,
      '--uil-height': this.il.type === 'textarea' ? '200px' : this.il.type === 'text' ? '50px' : 'auto'
    };
  }

  rootClasses(): string[] {
    const v = `uil-input--${this.il.variant ?? 'outlined'}`;
    const s = `uil-input--${this.il.size ?? 'md'}`;
    const dis = this.il.disabled ? 'is-disabled' : '';
    const inv = this.il.invalid ? 'is-invalid' : '';
    return ['uil-input', v, s, dis, inv].filter(Boolean);
  }

  fieldStyle(): Record<string,string> {
    const s = this.il.style;
    const map: Record<string,string> = {};
    if (!s) return map;
    if (s.backgroundColor) map['background']   = s.backgroundColor;
    if (s.color)           map['color']        = s.color;
    if (s.fontSize)        map['font-size']    = s.fontSize;
    if (s.fontWeight)      map['font-weight']  = s.fontWeight;
    if (s.fontStyle)       map['font-style']   = s.fontStyle;
    if (s.textDecoration)  map['text-decoration'] = s.textDecoration;
    if (s.padding)         map['padding']      = s.padding;
    if (s.margin)          map['margin']       = s.margin;
    if (s.borderRadius)    map['border-radius']= s.borderRadius;
    if (s.border)          map['border']       = s.border;
    if (s.boxShadow)       map['box-shadow']   = s.boxShadow;
    if (s.opacity !== undefined) map['opacity']= String(s.opacity);
    if (s.cursor)          map['cursor']       = s.cursor;
    if (s.width)           map['width']        = s.width;
    if (s.height)          map['height']       = s.height;
    // Posición opcional:
    if (s.position)        map['position']     = s.position;
    if (s.top)             map['top']          = s.top;
    if (s.right)           map['right']        = s.right;
    if (s.bottom)          map['bottom']       = s.bottom;
    if (s.left)            map['left']         = s.left;
    if (s.zIndex !== undefined) map['z-index'] = String(s.zIndex);
    return map;
  }

  labelStyle(): Record<string,string> {
    const s = this.il.label?.style;
    const map: Record<string,string> = {};
    if (!s) return map;
    if (s.color)        map['color']        = s.color;
    if (s.fontSize)     map['font-size']    = s.fontSize;
    if (s.fontWeight)   map['font-weight']  = s.fontWeight;
    if (s.fontStyle)    map['font-style']   = s.fontStyle;
    if (s.textDecoration) map['text-decoration'] = s.textDecoration;
    return map;
  }

  counterStyle(): Record<string,string> {
    const s = this.il.counter?.style;
    const map: Record<string,string> = {};
    if (!s) return map;
    if (s.color)      map['color']      = s.color;
    if (s.fontSize)   map['font-size']  = s.fontSize;
    if (s.fontWeight) map['font-weight']= s.fontWeight;
    if (s.fontStyle)  map['font-style'] = s.fontStyle;
    return map;
  }

  // ===== Autosize =====
  private setupTextareaBase() {
    const ta = this.ta?.nativeElement;
    if (!ta) return;
    ta.style.overflow = 'hidden';
    ta.style.resize   = 'none';
  }


  @HostListener('window:resize') onWinResize() { this.resizeTextarea(); }

  // ===== Handlers =====
  get value(): string { return this._value; }
  set value(v: string) {
    this._value = v ?? '';
    this.onChange(this._value);
    this.resizeTextarea();
  }

  onInput(ev: Event) {
    const el = ev.target as HTMLTextAreaElement | HTMLInputElement;
    let val = el.value ?? '';
    if (this.il.max !== undefined && val.length > this.il.max) {
      val = val.slice(0, this.il.max);
      el.value = val;
    }
    this._value = val;
    this.onChange(this._value);
    this.resizeTextarea();
  }

  onBlur() { this.onTouched(); }

  // Counter
  len(): number { return (this._value ?? '').length; }
  counterText(): string {
    const cur = this.len();
    return this.il.max ? `${cur}/${this.il.max}` : `${cur}`;
  }
  ngAfterViewInit(): void {
  if (this.isTextarea()) this.setupTextareaBase();
  this.resizeTextarea();
}
/** Forzar textarea cuando autoSize sea true */
isTextarea(): boolean {
  return !!this.il.autoSize || this.il.type === 'textarea';
}

private resizeTextarea() {
  if (!this.il.autoSize || !this.isTextarea()) return;
  const ta = this.ta?.nativeElement;
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight}px`;
}

}
