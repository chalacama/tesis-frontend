// src/app/shared/components/select-dataview/select-dataview.component.ts
import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import { UiSelectDataviewDirective } from '../../../directive/ui-select-dataview.directive';
import { IconComponent } from '../../button/icon/icon.component';

import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';
import { UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';

@Component({
  selector: 'ui-select-dataview',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './select-dataview.component.html',
  styleUrls: ['./select-dataview.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectDataviewComponent),
    multi: true
  }],
  hostDirectives: [{
    directive: UiSelectDataviewDirective,
    inputs: [
      // UiFormProps / UiProps
      'severity','size','disabled','neumorphism','variant','invalid',
      // A11y
      'ariaLabel','role','tabIndex','ariaPressed','title','onKeyDown',
      // Identidad/edición
      'id','editable','showClear',
      // Estilos
      'sdvClass','sdvStyle','optionStyle',
      // Icono
      'icon',
      // Datos
      'options','optionLabel','optionValue','optionSrc',
      // Selección/filtro
      'multiple','filter',
      // Límite / disposición
      'max','columns'
    ]
  }]
})
export class SelectDataviewComponent implements ControlValueAccessor {
  constructor(public readonly sdv: UiSelectDataviewDirective) {}

  // ==== Estado interno / UI ====
  filterText = '';
  newLabel = '';
  private selectedValues = new Set<string | number>();

  // ==== CVA (Reactive Forms) ====
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};
  private isDisabledByCva = false;
  private touched = false;

  // Propaga el valor al form
  private emitValue() {
    const value = this.getModelValue();
    this.onChange(value);
  }

  private markTouchedOnce() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  // Lo que el control devuelve al formulario:
  // - multiple=false => string|number|null
  // - multiple=true  => (string|number)[]
  private getModelValue(): any {
    if (this.sdv.multiple) return Array.from(this.selectedValues);
    return this.selectedValues.size ? Array.from(this.selectedValues)[0] : null;
  }

  // CVA: Escribe el valor que viene del formulario al control
  writeValue(value: any): void {
    this.selectedValues.clear();

    if (this.sdv.multiple) {
      if (Array.isArray(value)) {
        value.forEach(v => this.selectedValues.add(this.normalizeValue(v)));
      }
    } else {
      if (value !== undefined && value !== null) {
        this.selectedValues.add(this.normalizeValue(value));
      }
    }
  }

  // Convierte un objeto de opción o un valor primitivo al "value" final
  private normalizeValue(v: any): string | number {
    if (typeof v === 'object' && v !== null) {
      const key = (this.sdv.optionValue ?? 'value') as string;
      const maybe = v?.[key] ?? v?.id;
      return (maybe ?? JSON.stringify(v)) as string;
    }
    return v as string | number;
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabledByCva = isDisabled;
    this.sdv.disabled = isDisabled; // sincroniza con el Input de la directiva
  }

  // ==== Lógica de items ====
  private isPrimitive(opt: any) {
    return (typeof opt !== 'object' || opt === null);
  }

  getValue(opt: any): string | number {
    if (this.isPrimitive(opt)) return opt;
    const key = (this.sdv.optionValue ?? 'value') as string;
    return (opt?.[key] ?? opt?.id ?? JSON.stringify(opt));
  }

  getLabel(opt: any): string {
    if (this.isPrimitive(opt)) return String(opt);
    const key = (this.sdv.optionLabel ?? 'label') as string;
    return String(opt?.[key] ?? this.getValue(opt));
  }

  getSrc(opt: any): string | undefined {
    if (this.isPrimitive(opt)) return undefined;
    const key = (this.sdv.optionSrc ?? 'src') as string;
    return opt?.[key];
  }

  isSelected(opt: any): boolean {
    return this.selectedValues.has(this.getValue(opt));
  }

  private maxAllowed(): number {
    if (!this.sdv.multiple) return 1;
    const raw = this.sdv.max;
    if (typeof raw === 'number') return raw;
    const n = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : Number.MAX_SAFE_INTEGER;
  }

  canSelectMore(): boolean {
    return this.selectedValues.size < this.maxAllowed();
  }

  toggleSelection(opt: any) {
    if (this.sdv.disabled || this.isDisabledByCva) return;

    this.markTouchedOnce();

    const v = this.getValue(opt);
    if (this.isSelected(opt)) {
      this.selectedValues.delete(v);
    } else {
      if (!this.sdv.multiple) {
        this.selectedValues.clear();
        this.selectedValues.add(v);
      } else if (this.canSelectMore()) {
        this.selectedValues.add(v);
      }
    }
    this.emitValue();
  }

  clearSelection() {
    if (this.sdv.disabled || this.isDisabledByCva) return;
    this.markTouchedOnce();
    this.selectedValues.clear();
    this.emitValue();
  }

  handleItemKeydown(ev: KeyboardEvent, opt: any) {
    const keys = this.sdv.onKeyDown;
    const k = ev.key.toLowerCase();
    if (!keys || this.sdv.disabled || this.isDisabledByCva) return;

    const useEnter = keys.includes('enter') && k === 'enter';
    const useSpace = keys.includes('space') && (k === ' ' || k === 'spacebar');
    if (useEnter || useSpace) {
      this.toggleSelection(opt);
      ev.preventDefault();
    }
  }

  // ==== Filtro / Vista ====
  viewOptions(): any[] {
    const list = this.sdv.options ?? [];
    if (!this.sdv.filter || !this.filterText.trim()) return list;

    const needle = this.filterText.trim().toLowerCase();
    const key = (this.sdv.optionLabel ?? 'label') as string;
    return list.filter(opt => {
      const txt = this.isPrimitive(opt) ? String(opt) : String(opt?.[key] ?? '');
      return txt.toLowerCase().includes(needle);
    });
  }

  // ==== Editable ====
  addOption() {
    if (!this.sdv.editable || this.sdv.disabled || this.isDisabledByCva) return;
    const label = this.newLabel.trim();
    if (!label) return;

    const value = `${label}-${Date.now()}`;
    const opt = { [this.sdv.optionLabel ?? 'label']: label, [this.sdv.optionValue ?? 'value']: value };
    this.sdv.options = [...(this.sdv.options ?? []), opt];
    this.newLabel = '';
  }

  // ==== Estilos/Clases (igual que antes) ====
  private sizeTokens(size?: UiSize) {
    const s = size ?? 'md';
    return {
      gap:   s === 'sm' ? '6px' : s === 'lg' ? '12px' : '8px',
      pad:   s === 'sm' ? '8px' : s === 'lg' ? '14px' : '10px',
      font:  s === 'sm' ? '.9rem' : s === 'lg' ? '1rem' : '.95rem',
      itemH: s === 'sm' ? '44px' : s === 'lg' ? '60px' : '52px',
      radius:s === 'sm' ? '8px'  : s === 'lg' ? '12px' : '10px'
    };
  }

  styleMap(): Record<string, string> {
    const sev: UiSeverity = (this.sdv.severity as UiSeverity) ?? 'primary';
    const sizeTok = this.sizeTokens(this.sdv.size as UiSize);

    const cols = String(this.sdv.columns ?? 3);
    const base: Record<string, string> = {
      '--sdv-cols': cols,
      '--sdv-gap': sizeTok.gap,
      '--sdv-pad': sizeTok.pad,
      '--sdv-font': sizeTok.font,
      '--sdv-item-h': sizeTok.itemH,
      '--sdv-radius': sizeTok.radius,
      '--sdv-accent': `var(--sev-${sev})`,
      '--sdv-accent-hover': `var(--sev-${sev}-hover, var(--sev-${sev}))`,
      '--sdv-fg': 'var(--text-color)',
      '--sdv-bg': 'var(--card-bg)',
      '--sdv-border': 'var(--border-color)'
    };

    const overrides = styleToNgStyle(this.sdv.sdvStyle);
    return mergeStyles(base, overrides);
  }

  optionStyleMap(): Record<string, string> {
    return styleToNgStyle(this.sdv.optionStyle);
  }

  hostClasses(): string[] {
    const v = `v-${this.sdv.variant ?? 'outlined'}`;
    const s = `s-${this.sdv.size ?? 'md'}`;
    const neu = `neu-${this.sdv.neumorphism ?? 'flat'}`;
    const dis = this.sdv.disabled ? 'is-disabled' : '';
    const inv = this.sdv.invalid ? 'is-invalid' : '';
    const extra = this.sdv.sdvClass ?? '';
    return ['sdv', v, s, neu, dis, inv, extra].filter(Boolean);
  }

  trackByValue = (_: number, opt: any) => this.getValue(opt);
}
