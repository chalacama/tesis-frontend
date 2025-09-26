import { CommonModule } from '@angular/common';
import {
  Component, forwardRef, Input, Output, EventEmitter, OnChanges, inject
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import {  UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';
import { UiCheckboxDirective } from '../../../directive/ui-checkbox.directive';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  hostDirectives: [{
    directive: UiCheckboxDirective,
    inputs: [
      // UiForm/UiProps
      'severity','size','disabled','neumorphism','variant','invalid',
      // A11y
      'ariaLabel','role','tabIndex','ariaPressed','title',
      // Checkbox specifics
      'class','style','type','checked','indeterminate','id'
    ]
  }]
})
export class CheckboxComponent implements ControlValueAccessor, OnChanges {
  constructor(public readonly ui: UiCheckboxDirective) {}

  /** Output opcional para casos fuera de Reactive Forms */
  @Output() changed = new EventEmitter<boolean>();

  /** ControlValueAccessor */
  private onChange: (val: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: boolean | null): void {
    const v = !!val;
    this.ui.checked = v;
    // si viene null y hay indeterminate en tablas, respetamos indeterminate
    if (val === null) this.ui.indeterminate = true;
    else this.ui.indeterminate = false;
  }
  registerOnChange(fn: (val: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.ui.disabled = isDisabled; }

  /** Manejo click/teclado */
  toggleFromUser(ev?: Event) {
    if (this.ui.disabled) return;
    // si estaba indeterminate, lo limpiamos y pasamos a true
    if (this.ui.indeterminate) {
      this.ui.indeterminate = false;
      this.ui.checked = true;
    } else {
      this.ui.checked = !this.ui.checked;
    }
    this.onChange(this.ui.checked);
    this.changed.emit(this.ui.checked);
    this.onTouched();
    ev?.preventDefault();
  }

  onKeydown(ev: KeyboardEvent) {
    if (this.ui.disabled) return;
    const k = ev.key.toLowerCase();
    if (k === ' ' || k === 'spacebar' || k === 'enter') {
      this.toggleFromUser(ev);
      ev.preventDefault();
    }
  }

  ngOnChanges(): void {
    // Si el host le pasa [checked]/[indeterminate] directos (no Reactive Forms)
    // no hacemos nada especial: el template refleja ui.checked/ui.indeterminate
  }

  /** === Style tokens (size + severity) === */
  private sizeTokens(size: UiSize | undefined) {
    const s = (size ?? 'md') as UiSize;
    return {
      box:   s === 'sm' ? '16px' : s === 'lg' ? '22px' : '18px',
      font:  s === 'sm' ? '.86rem' : s === 'lg' ? '1rem' : '.93rem',
      gap:   s === 'sm' ? '8px'   : s === 'lg' ? '10px' : '8px',
      radius:s === 'sm' ? '4px'   : s === 'lg' ? '6px'  : '5px',
      mark:  s === 'sm' ? '10px'  : s === 'lg' ? '14px' : '12px',
      shadow: s === 'sm' ? '1px 2px 6px' : s === 'lg' ? '4px 6px 10px' : '2px 4px 8px',
      shadowContrast: s === 'sm' ? '0px -1px 3px' : s === 'lg' ? '3px -4px 5px' : '2px -2px 4px',
    };
  }

  cssVars(): Record<string, string> {
    const sev = (this.ui.severity as UiSeverity) ?? 'primary';
    const size = this.sizeTokens(this.ui.size as UiSize);

    const sevBg = `var(--sev-${sev})`;
    const sevHover = `var(--sev-${sev}-hover, ${sevBg})`;
    const text = `var(--text-color)`;
    const border = `var(--border-color)`;

    return mergeStyles({
      '--chk-size': size.box,
      '--chk-radius': size.radius,
      '--chk-gap': size.gap,
      '--chk-font': size.font,
      '--chk-mark-size': size.mark,

      '--chk-fg': text,
      '--chk-border': border,
      '--chk-active': sevBg,
      '--chk-active-hover': sevHover,

      '--chk-shadow': size.shadow,
      '--chk-shadow-contrast': size.shadowContrast,
    }, styleToNgStyle(this.ui.style));
  }

  hostClasses(): string[] {
    const neu = `neu-${this.ui.neumorphism ?? 'flat'}`;
    const v   = `v-${this.ui.variant ?? 'flat'}`;
    const s   = `s-${this.ui.size ?? 'md'}`;
    const t   = `t-${this.ui.type ?? 'column'}`; // row|column
    const sev = `sev-${this.ui.severity ?? 'primary'}`;
    const bad = this.ui.invalid ? 'is-invalid' : '';
    const dis = this.ui.disabled ? 'is-disabled' : '';
    const ind = this.ui.indeterminate ? 'is-indeterminate' : '';
    const extra = this.ui.class ?? '';
    return ['ui-checkbox', neu, v, s, t, sev, bad, dis, ind, extra].filter(Boolean);
  }

  /** A11y bindings */
  ariaChecked(): 'true'|'false'|'mixed' {
    if (this.ui.indeterminate) return 'mixed';
    return this.ui.checked ? 'true' : 'false';
  }
}


