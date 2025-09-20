// components/toggle-witch/toggle-witch.component.ts
import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnChanges,
  forwardRef,
  computed,
  inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';
import { UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';
import { UiToogleWitchDirective } from '../../../directive/ui-toogle-witch.directive';

@Component({
  selector: 'ui-toggle-witch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-witch.component.html',
  styleUrls: ['./toggle-witch.component.css'],
  hostDirectives: [
    {
      directive: UiToogleWitchDirective,
      inputs: [
        // Re-export de TODOS los inputs
        'severity',
        'size',
        'disabled',
        'neumorphism',
        'variant',
        'invalid',
        'ariaLabel',
        'role',
        'tabIndex',
        'ariaPressed',
        'title',
        'type',
        'tggWClass',
        'tggWStyle'
      ]
    }
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleWitchComponent),
      multi: true
    }
  ]
})
export class ToggleWitchComponent implements ControlValueAccessor, OnChanges {
  // Inyectamos la directiva para leer sus valores actuales
  constructor(public readonly tgg: UiToogleWitchDirective) {}

  /** ===== ControlValueAccessor ===== */
   _checked = false;
  private onChange: (val: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: boolean): void {
    this._checked = !!val;
  }
  registerOnChange(fn: (val: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.tgg.disabled = isDisabled;
  }

  /** ===== UI ===== */
  ngOnChanges(): void {}

  toggleFromUI(): void {
    if (this.tgg.disabled) return;
    this._checked = !this._checked;
    this.onChange(this._checked);
    this.onTouched();
  }

  /** Accesibilidad con teclado (Enter/Espacio) */
  @HostListener('keydown', ['$event'])
  handleKeydown(ev: KeyboardEvent) {
    if (this.tgg.disabled) return;
    const key = ev.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      ev.preventDefault();
      this.toggleFromUI();
    }
  }

  /** Clases del host */
  hostClasses(): string[] {
    const v = `v-${this.tgg.variant ?? 'filled'}`;
    const s = `s-${this.tgg.size ?? 'md'}`;
    const neu = `neu-${this.tgg.neumorphism ?? 'flat'}`;
    const dis = this.tgg.disabled ? 'is-disabled' : '';
    const inv = this.tgg.invalid ? 'is-invalid' : '';
    const ty = `t-${this.tgg.type ?? 'switch'}`;
    const extra = this.tgg.tggWClass ?? '';
    const isOn = this._checked ? 'is-checked' : '';
    return ['ui-togg', v, s, neu, ty, dis, inv, isOn, extra].filter(Boolean);
  }

  /** Tokens por tamaño */
  private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      trackW: s === 'sm' ? '34px' : s === 'lg' ? '56px' : '44px',
      trackH: s === 'sm' ? '18px' : s === 'lg' ? '28px' : '22px',
      thumb:  s === 'sm' ? '14px' : s === 'lg' ? '24px' : '18px',
      gap:    s === 'sm' ? '6px'  : s === 'lg' ? '10px' : '8px',
      font:   s === 'sm' ? '.85rem': s === 'lg' ? '1rem' : '.95rem',
      pad:    s === 'sm' ? '2px'  : s === 'lg' ? '3px' : '2px'
    };
  }

  /** CSS vars + overrides */
  styleMap(): Record<string, string> {
    const sev: UiSeverity = (this.tgg.severity as UiSeverity) ?? 'primary';
    const sTok = this.sizeTokens(this.tgg.size as UiSize);

    const sevBg = `var(--sev-${sev})`;
    const sevBgHover = `var(--sev-${sev}-hover, ${sevBg})`;
    const sevOff = `var(--border-color, #CBD5E1)`;
    const fg = `var(--text-color-contrast, #fff)`;

    const base: Record<string, string> = {
      '--togg-track-w': sTok.trackW,
      '--togg-track-h': sTok.trackH,
      '--togg-thumb': sTok.thumb,
      '--togg-pad': sTok.pad,
      '--togg-font': sTok.font,
      '--togg-gap': sTok.gap,
      '--togg-on': sevBg,
      '--togg-on-hover': sevBgHover,
      '--togg-off': sevOff,
      '--togg-fg': fg
    };

    const overrides = styleToNgStyle(this.tgg.tggWStyle);
    return mergeStyles(base, overrides);
  }

  /** ARIA helpers */
  ariaChecked(): 'true' | 'false' {
    return this._checked ? 'true' : 'false';
  }
}


