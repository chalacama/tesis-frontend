// import { CommonModule } from '@angular/common';
// import { Component, forwardRef, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// import { UiPresetsDirective } from '../../../directive/ui-presets.directive';
// import { UiCheckboxDirective } from '../../../directive/ui-checkbox.directive'; // <- el de arriba
// import { UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';

// @Component({
//   selector: 'ui-checkbox',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './checkbox.component.html',
//   styleUrls: ['./checkbox.component.css'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   providers: [{
//     provide: NG_VALUE_ACCESSOR,
//     useExisting: forwardRef(() => CheckboxComponent),
//     multi: true
//   }],
//   hostDirectives: [
//     {
//       directive: UiPresetsDirective,
//       inputs: [
//         'severity','size','disabled','raised',
//         'width','height','radius','fontSize','gap',
//         'bg','fg','hoverBg','borderColor','borderWidth','iconSize',
//         'ariaLabel'
//       ],
//     },
//     {
//       directive: UiCheckboxDirective,
//       inputs: ['label','bgChecked'],
//     }
//   ],
// })
// export class CheckboxComponent implements ControlValueAccessor {
//   /** Inyección de presets y props específicas del checkbox */
//   readonly presets = inject(UiPresetsDirective);
//   readonly cb = inject(UiCheckboxDirective);

//   private _value = signal<boolean>(false);
//   value = computed(() => this._value());

//   // CVA
//   writeValue(v: boolean): void { this._value.set(!!v); }
//   registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
//   registerOnTouched(fn: () => void): void { this.onTouched = fn; }
//   setDisabledState(isDisabled: boolean): void { this.presets.disabled = isDisabled; }

//   private onChange: (v: boolean) => void = () => {};
//   private onTouched: () => void = () => {};

//   toggleFromInput(checked: boolean) {
//     if (this.presets.disabled) return;
//     this._value.set(checked);
//     this.onChange(checked);
//     this.onTouched();
//   }

//   /** Normaliza '8' -> '8px' */
//   private normalizeRadius(rad?: string): string {
//     if (!rad) return '';
//     return /^\d+$/.test(rad) ? `${rad}px` : rad;
//   }

//   /** Mapear presets -> CSS vars del checkbox */
//   groupVars(): Record<string,string> {
//     const p = this.presets;

//     // tokens de color según severidad
//     const sev = p.severity as UiSeverity;
//     const sevColor = `var(--sev-${sev})`;
//     const sevHover = `var(--sev-${sev}-hover)`;

//     // tamaño del cuadro (usa iconSize si lo pasas; si no, por tamaño)
//     const size = p.iconSize
//       ?? (p.size === 'sm' ? '14px' : p.size === 'lg' ? '16px' : '25px');

//     const borderWidth = p.borderWidth ?? '1.5px';
//     const radius = this.normalizeRadius(p.radius) || '5px';
//     const gap = p.gap ?? '10px';

//     // fondo al estar marcado (override opcional via UiCheckboxDirective)
//     const bgChecked = this.cb.bgChecked ?? `color-mix(in oklab, ${sevColor} 18%, transparent)`;

//     return {
//       '--cb-size': size,
//       '--cb-border-width': borderWidth,
//       '--cb-radius': radius,
//       '--cb-gap': gap,

//       '--cb-color': sevColor,
//       '--cb-color-hover': sevHover,
//       '--cb-border-color': p.borderColor ?? sevColor,

//       '--cb-bg-checked': bgChecked,
//       '--cb-text': p.fg ?? 'var(--text-color)',
//     };
//   }

//   hostClasses(): string[] {
//     const p = this.presets;
//     return [
//       p.disabled ? 'is-disabled' : ''
//     ];
//   }
// }
