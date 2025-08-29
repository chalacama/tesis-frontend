import {
  Component, Output, EventEmitter, forwardRef,
  ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import { UiPresetsDirective } from '../../../directive/ui-presets.directive';
import { UiSelectBottonDirective } from '../../../directive/ui-select-botton.directive';

import { SBBasicOption, SBBasicValue, UiSBVariant } from '../../../interfaces/ui-select-button';
import { UiSeverity, UiSize } from '../../../interfaces/ui-types';

// ...imports iguales...
@Component({
  selector: 'ui-select-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-button.component.html',
  styleUrls: ['./select-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectButtonComponent),
    multi: true
  }],
  hostDirectives: [
    {
      directive: UiPresetsDirective,
      inputs: [
        'severity','size','disabled','raised',
        'width','height','radius','fontSize','gap',
        'bg','fg','hoverBg','borderColor','borderWidth','iconSize',
        'ariaLabel'
      ],
    },
    {
      directive: UiSelectBottonDirective,
      inputs: ['label','options','orientation','error','variant','boxed'],
    }
  ],
})
export class SelectButtonComponent implements ControlValueAccessor {
  readonly presets = inject(UiPresetsDirective);
  readonly sb = inject(UiSelectBottonDirective);

  @Output() selectionChange = new EventEmitter<SBBasicValue>();

  value!: SBBasicValue | null;
  onChange: (val: SBBasicValue | null) => void = () => {};
  onTouched: () => void = () => {};
  writeValue(val: SBBasicValue | null): void { this.value = val; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.presets.disabled = isDisabled; }

  selectOption(opt: SBBasicOption) {
    if (this.presets.disabled || opt.disabled) return;
    this.value = opt.value;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
    this.onTouched();
  }
  isChecked(opt: SBBasicOption) { return this.value === opt.value; }

  private normalizeRadius(rad?: string | number): string {
    if (rad === undefined || rad === null) return '';
    return typeof rad === 'number'
      ? `${rad}px`
      : (/^\d+$/.test(rad) ? `${rad}px` : rad);
  }

  groupVars(): Record<string,string> {
    const p = this.presets;

    const sevColor = `var(--sev-${p.severity as UiSeverity})`;
    const sevHover = `var(--sev-${p.severity as UiSeverity}-hover)`;

    const font =
      p.fontSize ?? (p.size === 'sm' ? '.85rem' : p.size === 'lg' ? '1rem' : '.95rem');
    const padBlock =
      p.size === 'sm' ? '.3rem' : p.size === 'lg' ? '.7rem' : '.5rem';
    const padInline =
      p.size === 'sm' ? '.55rem' : p.size === 'lg' ? '1rem' : '.8rem';

    // ⬇️ segmented ahora usa un gap fijo de 1px
    const isSegmented = (this.sb.variant as UiSBVariant) === 'segmented';
    const gap = isSegmented
      ? '1px'
      : (p.gap ?? (p.size === 'sm' ? '.375rem' : p.size === 'lg' ? '.625rem' : '.5rem'));

    const normalized = this.normalizeRadius(p.radius);
    const computedRadius = normalized || '8px';

    const baseBg = p.bg ?? 'var(--card-bg)';
    const hovBg  = p.hoverBg ?? 'var(--background-hover)';

    const panelRadius = computedRadius || '12px';

    return {
      '--sbb-font': font,
      '--sbb-pad-block': padBlock,
      '--sbb-pad-inline': padInline,
      '--sbb-gap': gap,
      '--sbb-radius': computedRadius,

      '--sbb-border': p.borderColor ?? 'var(--border-color)',
      '--sbb-active': sevColor,
      '--sbb-hover': hovBg,
      '--sbb-bg': baseBg,

      '--sbb-shadow': 'var(--shadow-color)',
      '--sbb-text': p.fg ?? 'var(--text-color)',
      '--sbb-text-secondary': 'var(--text-color-secondary)',

      '--sbb-variant-color': sevColor,
      '--sbb-variant-hover': sevHover,

      '--sbb-panel-bg': 'color-mix(in oklab, var(--background-hover) 65%, transparent)',
      '--sbb-panel-border': 'var(--border-color)',
      '--sbb-panel-radius': panelRadius,
      '--sbb-panel-pad': '.375rem',
    };
  }

  hostClasses(): string[] {
    const p = this.presets;
    const s = this.sb;

    // ⬇️ Sanitiza 'tabs' → 'loose' para no generar la clase v-tabs
    const safeVariant = (s.variant as UiSBVariant) === 'tabs' ? 'loose' : (s.variant as UiSBVariant);

    return [
      `v-${safeVariant}`,
      `s-${p.size as UiSize}`,
      p.disabled ? 'is-disabled' : '',
      s.orientation === 'vertical' ? 'vertical' : 'horizontal',
      s.boxed ? 'has-panel' : ''
    ];
  }
}

