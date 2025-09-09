// toggle-witch.component.ts
// import {
//   Component, ChangeDetectionStrategy, forwardRef, Output, EventEmitter, inject, HostListener
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

// // Tus directivas base
// import { UiPresetsDirective } from '../../../directive/ui-presets.directive';


// import { UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';
// import { UiToogleWitchDirective } from '../../../directive/ui-toogle-witch.directive';

// @Component({
//   selector: 'ui-toggle-witch',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './toggle-witch.component.html',
//   styleUrls: ['./toggle-witch.component.css'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   providers: [{
//     provide: NG_VALUE_ACCESSOR,
//     useExisting: forwardRef(() => ToggleWitchComponent),
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
//       directive: UiToogleWitchDirective,
//       inputs: ['label','onLabel','offLabel','variant','reverse','dense','error','ariaLabel'],
//     }
//   ],
//   host: {
//     '[attr.role]': '"switch"',
//     '[attr.aria-checked]': 'checked',
//     '[attr.aria-label]': 'tw.ariaLabel || presets.ariaLabel || null',
//     '[attr.tabindex]': 'presets.disabled ? -1 : 0'
//   }
// })
// export class ToggleWitchComponent implements ControlValueAccessor {
//   readonly presets = inject(UiPresetsDirective);
//   readonly tw = inject(UiToogleWitchDirective);

//   @Output() changed = new EventEmitter<boolean>();

//   checked = false;

//   // CVA
//   private onChange: (v: boolean) => void = () => {};
//   private onTouched: () => void = () => {};

//   writeValue(v: boolean | null): void {
//     this.checked = !!v;
//   }
//   registerOnChange(fn: any): void { this.onChange = fn; }
//   registerOnTouched(fn: any): void { this.onTouched = fn; }
//   setDisabledState(isDisabled: boolean): void { this.presets.disabled = isDisabled; }

//   // Interacción
//   toggle(): void {
//     if (this.presets.disabled) return;
//     this.checked = !this.checked;
//     this.onChange(this.checked);
//     this.changed.emit(this.checked);
//     this.onTouched();
//   }

//   @HostListener('keydown', ['$event'])
//   onKeydown(e: KeyboardEvent) {
//     if (this.presets.disabled) return;
//     if (e.key === ' ' || e.key === 'Enter') {
//       e.preventDefault();
//       this.toggle();
//     }
//     if (e.key === 'ArrowLeft') { this.set(false); }
//     if (e.key === 'ArrowRight') { this.set(true); }
//   }

//   set(v: boolean) {
//     if (this.presets.disabled) return;
//     if (this.checked !== v) {
//       this.checked = v;
//       this.onChange(this.checked);
//       this.changed.emit(this.checked);
//       this.onTouched();
//     }
//   }

//   // ---- Estilos: variables y clases host ----
//   private normalizeRadius(rad?: string | number): string {
//     if (rad === undefined || rad === null) return '';
//     return typeof rad === 'number'
//       ? `${rad}px`
//       : (/^\d+$/.test(rad) ? `${rad}px` : rad);
//   }

//   groupVars(): Record<string,string> {
//     const p = this.presets;
//     const sev = p.severity as UiSeverity;

//     const font =
//       p.fontSize ?? (p.size === 'sm' ? '.85rem' : p.size === 'lg' ? '1rem' : '.95rem');

//     const height =
//       p.height ?? (p.size === 'sm' ? '22px' : p.size === 'lg' ? '30px' : '26px');

//     const width =
//       p.width ?? (p.size === 'sm' ? '40px' : p.size === 'lg' ? '56px' : '48px');

//     const thumb =
//       p.iconSize ?? (p.size === 'sm' ? '14px' : p.size === 'lg' ? '18px' : '16px');

//     const gap =
//       p.gap ?? (this.tw.dense ? '6px' : (p.size === 'sm' ? '8px' : p.size === 'lg' ? '10px' : '8px'));

//     const normalized = this.normalizeRadius(p.radius);
//     const computedRadius = normalized || '999px';

//     const sevColor = `var(--sev-${sev})`;
//     const sevHover = `var(--sev-${sev}-hover)`;

//     const activeBg = p.bg ?? 'var(--switcher-active-bg)';
//     const baseBg   = p.bg ?? 'var(--background-active)';

//     return {
//       '--tw-font': font,
//       '--tw-width': width,
//       '--tw-height': height,
//       '--tw-thumb': thumb,
//       '--tw-gap': gap,

//       '--tw-radius': computedRadius,
//       '--tw-border': p.borderColor ?? 'var(--switcher-border)',

//       '--tw-text': p.fg ?? 'var(--text-color)',
//       '--tw-text-secondary': 'var(--text-color-secondary)',

//       '--tw-active': activeBg ?? sevColor,
//       '--tw-hover': p.hoverBg ?? 'var(--switcher-hover)',
//       '--tw-bg': baseBg,

//       '--tw-variant-color': sevColor,
//       '--tw-variant-hover': sevHover
//     };
//   }

//   hostClasses(): string[] {
//     const p = this.presets;
//     const t = this.tw;

//     return [
//       `s-${p.size as UiSize}`,
//       `v-${t.variant}`,
//       this.checked ? 'is-checked' : 'is-unchecked',
//       p.disabled ? 'is-disabled' : '',
//       t.error ? 'has-error' : '',
//       t.reverse ? 'is-reverse' : 'is-normal',
//       t.dense ? 'is-dense' : ''
//     ];
//   }
// }

