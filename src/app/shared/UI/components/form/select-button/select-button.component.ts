import {
  Component, Output, EventEmitter, forwardRef,
  ChangeDetectionStrategy, inject, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';


import { ButtonComponent } from '../../button/button/button.component'; // tu <ui-button>
import { UiSbtnProps } from '../../../interfaces/ui-select-button';
import { UiSize } from '../../../interfaces/ui-presets.interface';
import { UiButtonProps } from '../../../interfaces/ui-button.interface';
import { UiSelectBottonDirective } from '../../../directive/ui-select-botton.directive';

@Component({
  selector: 'ui-select-button',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
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
      directive: UiSelectBottonDirective,
      // SOLO inputs reales de la directiva
      inputs: [
        'id','btns','orientation','options','optionLabel','multiple','optionValue',
        'invalid','severity','size','disabled','neumorphism','variant',
        'ariaLabel','role','tabIndex','ariaPressed','title'
      ],
    }
  ],
})
export class SelectButtonComponent implements ControlValueAccessor {
  // Directiva única (todas las props vienen de aquí)
  readonly sb = inject(UiSelectBottonDirective);

  // Inputs PROPIOS del componente (para el field)
  /* @Input() label?: string; */
  /* @Input() error?: string; */
/*   @Input() boxed: boolean = false; */

  @Output() selectionChange = new EventEmitter<any | any[]>();
    brBtnCenter ='0px';
    brBtnLeft ='5px 0px 0px 5px';
    brBtnRight ='0px 5px 5px 0px';
  value: any | any[] | null = null;
  onChange: (val: any | any[] | null) => void = () => {};
  onTouched: () => void = () => {};

  // ---- CVA ----
  writeValue(val: any | any[] | null): void { this.value = val; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.sb.disabled = isDisabled; }

  // ===== Helpers de datos (sin tipos inventados) =====
  private getOptLabel(opt: any): string {
    if (!opt) return '';
    const key = this.sb.optionLabel || 'label';
    return (opt?.[key] ?? opt?.label ?? String(opt)) as string;
  }
  private getOptValue(opt: any, index: number): any {
    // options: usa optionValue si es string (clave); si no, usa el objeto entero
    if (this.sb.options && typeof this.sb.optionValue === 'string') {
      return opt?.[this.sb.optionValue];
    }
    // btns: no tienen "value" -> usamos el índice por defecto
    if (this.sb.btns) return index;
    return opt;
  }

  /** Lista unificada para iterar en el template (desde options y/o btns) */
  get items(): Array<{ label: string; value: any; disabled?: boolean }> {
    const list: Array<{ label: string; value: any; disabled?: boolean }> = [];

    if (Array.isArray(this.sb.options) && this.sb.options.length) {
      this.sb.options.forEach((opt: any, i: number) => {
        list.push({
          label: this.getOptLabel(opt),
          value: this.getOptValue(opt, i),
          disabled: !!opt?.disabled,
        });
      });
    } else if (Array.isArray(this.sb.btns) && this.sb.btns.length) {
      this.sb.btns.forEach((btn: UiButtonProps, i: number) => {
        list.push({
          label: btn?.label ?? `Opción ${i + 1}`,
          value: this.getOptValue(btn, i), // índice por defecto
          disabled: !!btn?.disabled,
        });
      });
    }
    return list;
  }

  // ===== Selección =====
  selectOption(item: { value: any; disabled?: boolean }) {
    if (this.sb.disabled || item.disabled) return;

    if (this.sb.multiple) {
      const current = Array.isArray(this.value) ? [...this.value] : [];
      const idx = current.findIndex(v => this.equals(v, item.value));
      if (idx >= 0) current.splice(idx, 1); else current.push(item.value);
      this.value = current;
    } else {
      this.value = this.equals(this.value, item.value) ? null : item.value;
    }

    this.onChange(this.value);
    this.selectionChange.emit(this.value as any | any[]);
    this.onTouched();
  }

  /* isChecked(item: { value: any }) {
    return this.sb.multiple
      ? Array.isArray(this.value) && this.value.some(v => this.equals(v, item.value))
      : this.equals(this.value, item.value);
  } */
// in UiSelectBottonDirective class
isCheckedAndClass(item: { value: any }) {
  const isChecked = this.sb.multiple
    ? Array.isArray(this.value) && this.value.some(v => this.equals(v, item.value))
    : this.equals(this.value, item.value);

  const btnClass = isChecked ? 'sbb-span checked' : 'sbb-span';
  const spanClass = item.value === 1 ? 'sbb-span-right' : item.value === this.items.length - 1 ? '' : 'sbb-span-left';

  return `${btnClass} ${spanClass}`;
}
  // ===== Estilos y clases =====
  groupVars(): Record<string,string> {
    const size = (this.sb.size as UiSize) ?? 'md';
    const font =
      size === 'sm' ? '.85rem' : size === 'lg' ? '1rem' : '.95rem';
    const padBlock =
      size === 'sm' ? '.3rem' : size === 'lg' ? '.7rem' : '.5rem';
    const padInline =
      size === 'sm' ? '.55rem' : size === 'lg' ? '1rem' : '.8rem';

    return {
      '--sbb-font': font,
      '--sbb-pad-block': padBlock,
      '--sbb-pad-inline': padInline,
      '--sbb-gap': size === 'sm' ? '.375rem' : size === 'lg' ? '.625rem' : '.5rem',
      '--sbb-radius': '8px',
      '--sbb-border': 'var(--border-color)',
      '--sbb-active': `var(--sev-${this.sb.severity ?? 'primary'})`,
      '--sbb-hover': 'var(--background-hover)',
      '--sbb-bg': 'var(--card-bg)',
      '--sbb-shadow': 'var(--shadow-color)',
      '--sbb-text': 'var(--text-color)',
      '--sbb-panel-bg': 'color-mix(in oklab, var(--background-hover) 65%, transparent)',
      '--sbb-panel-border': 'var(--border-color)',
      '--sbb-panel-radius': '10px',
      '--sbb-panel-pad': '.375rem',
    };
  }

  hostClasses(): string[] {
    const size = (this.sb.size as UiSize) ?? 'md';
    const variant = this.sb.variant ?? 'filled';
    return [
      `v-${variant}`,
      `s-${size}`,
      this.sb.disabled ? 'is-disabled' : '',
      this.sb.orientation === 'vertical' ? 'vertical' : 'horizontal',
    ];
  }

  private equals(a: any, b: any): boolean { return a === b; }

  
}
