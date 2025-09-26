import { CommonModule } from '@angular/common';
import {
  Component, ElementRef, forwardRef, HostListener, OnDestroy, OnInit, ViewChild, inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { UiSelectDirective } from '../../../directive/ui-select.directive';
import { IconComponent } from '../../button/icon/icon.component';
import { PopoverComponent } from '../../overlay/popover/popover.component';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';
import { CheckboxComponent } from '../checkbox/checkbox.component';

type Primitive = string | number | boolean | null | undefined;

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent,PopoverComponent, CheckboxComponent,DragDropModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
  hostDirectives: [{
    directive: UiSelectDirective,
    inputs: [
      // UiProps / UiFormProps
      'severity','size','disabled','neumorphism','variant','invalid',
      // A11y
      'ariaLabel','role','tabIndex','ariaPressed','title',
      // Select props
      'id','placeholder','editable','showClear','class','style',
      'icon','popover','options','optionLabel','optionValue','multiple','filter','max','type',
      'maxBadge', // numero de badge
      'showBadge', // oculta solo el badge del popover
    ]
  }],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectComponent),
    multi: true
  }]
})
export class SelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  // Acceso a inputs de la directiva
   ui: UiSelectDirective = inject(UiSelectDirective);

  // Estado interno
  povOpen = false;
  search = '';
  allSelected = false;
  someSelected = false;
  showClear = this.ui.showClear ?? true;

  // Para cerrar al hacer click fuera
  private host = inject(ElementRef<HTMLElement>);

  // ControlValueAccessor
   _value : any  = this.ui.multiple? [] : null;
  
  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  // ====== Utils de options ======
   getLabel(opt: any): string {
    const key = this.ui.optionLabel || 'label';
    return (opt && typeof opt === 'object') ? String(opt[key]) : String(opt);
  }
  private getValue(opt: any): Primitive {
    const key = this.ui.optionValue ?? 'value';
    return (opt && typeof opt === 'object')
      ? (opt[key as keyof typeof opt] as Primitive)
      : (opt as Primitive);
  }
  private equals(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // ====== Externos/filtrados ======
  get filteredOptions(): any[] {
    const opts = this.ui.options ?? [];
    if (!this.ui.filter || !this.search.trim()) return opts;
    const q = this.search.toLowerCase();
    return opts.filter(o => this.getLabel(o).toLowerCase().includes(q));
  }

  // ====== Selección ======
  get isMultiple(): boolean { return !!this.ui.multiple; }
  private coerceMax(): number {
    const m = this.ui.max as any;
    const n = Number(m);
    return Number.isFinite(n) ? n : Infinity;
  }
  get selectedArray(): any[] {
    return Array.isArray(this._value) ? this._value : [];
  }

 
  getChipLabel(v: any): string {
  const option = (this.ui.options ?? []).find(o => JSON.stringify(this.getValue(o)) === JSON.stringify(v));
  return option ? this.getLabel(option) : v;
}
  writeValue(obj: any): void {
    this._value = this.isMultiple ? (Array.isArray(obj) ? obj : []) : obj ?? null;
    this.syncHeaderState();
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.ui.disabled = isDisabled; }

  ngOnInit(): void {
    // Nada extra por ahora
  }
  ngOnDestroy(): void {}

  // Abre/cierra
  togglePopover(): void {
    if (this.ui.disabled) return;
    this.povOpen = !this.povOpen;
  }

  clearAll(ev?: MouseEvent): void {
    ev?.stopPropagation();
    if (this.ui.disabled) return;
    if (this.isMultiple) {
      this._value = [];
    } else {
      this._value = null;
    }
    this.onChange(this._value);
    this.syncHeaderState();
  }

  // Click fuera -> cerrar
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.povOpen) return;
    const target = e.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.povOpen = false;
      this.onTouched();
    }
  }
  // Añade este getter en la clase SelectComponent
get maxInline(): number {
  const n = Number(this.ui.maxBadge ?? 3);
  // seguridad: al menos 1
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

  // ====== Selección single ======
  chooseOne(opt: any) {
    if (this.ui.disabled) return;
    const val = this.getValue(opt);
    this._value = val;
    this.onChange(this._value);
    this.povOpen = false;
  }

  // ====== Selección multiple ======
  isChecked(opt: any): boolean {
    const v = this.getValue(opt);
    return this.selectedArray.some(x => this.equals(x, v));
  }

  canAddMore(): boolean {
    return this.selectedArray.length < this.coerceMax();
  }

  toggleItem(opt: any) {
    if (this.ui.disabled) return;
    const val = this.getValue(opt);
    let next = [...this.selectedArray];

    const idx = next.findIndex(x => this.equals(x, val));
    if (idx >= 0) {
      next.splice(idx, 1);
    } else {
      if (!this.canAddMore()) return; // respeta max
      next.push(val);
    }
    this._value = next;
    this.onChange(this._value);
    this.syncHeaderState();
  }

  removeChip(v: any, ev?: MouseEvent) {
    ev?.stopPropagation();
    let next = [...this.selectedArray];
    const idx = next.findIndex(x => this.equals(x, v));
    if (idx >= 0) next.splice(idx, 1);
    this._value = next;
    this.onChange(this._value);
    this.syncHeaderState();
  }

  toggleAll(checked: boolean) {
    if (this.ui.disabled) return;
    if (checked) {
      const max = this.coerceMax();
      const vals = this.filteredOptions.slice(0, max).map(o => this.getValue(o));
      this._value = vals;
    } else {
      this._value = [];
    }
    this.onChange(this._value);
    this.syncHeaderState();
  }

  onRowToggle() {
    // hook si quieres lógica extra cuando cambia una fila
    this.syncHeaderState();
  }

  private syncHeaderState() {
    if (!this.isMultiple) {
      this.allSelected = false;
      this.someSelected = !!this._value;
      return;
    }
    const total = this.filteredOptions.length;
    const sel = this.selectedArray.length;
    this.allSelected = total > 0 && sel >= Math.min(total, this.coerceMax()) && sel > 0;
    this.someSelected = sel > 0 && !this.allSelected;
  }

  // ====== Visual del placeholder y display ======
  /* get displayText(): string {
    if (this.isMultiple) {
      const selected = this.selectedArray;
      if (selected.length === 0) return '';
      const maxInline = 3;
      if (selected.length <= maxInline) {
        // mostrar labels unidos por coma
        const labels = selected
          .map(v => (this.ui.options ?? []).find(o => this.equals(this.getValue(o), v)))
          .filter(Boolean)
          .map(o => this.getLabel(o));
        return labels.join(', ');
      }
      // cuando supera maxInline → “X seleccionados”
      return `${selected.length} seleccionados`;
    } else {
      if (this._value == null) return '';
      const found = (this.ui.options ?? []).find(o => this.equals(this.getValue(o), this._value));
      return found ? this.getLabel(found) : String(this._value);
    }
  } */
get displayText(): string {
  if (this.isMultiple) {
    const selected = this.selectedArray;
    if (selected.length === 0) return '';
    if (selected.length <= this.maxInline) { // 👈 aquí
      const labels = selected
        .map(v => (this.ui.options ?? []).find(o => this.equals(this.getValue(o), v)))
        .filter(Boolean)
        .map(o => this.getLabel(o));
      return labels.join(', ');
    }
    return `${selected.length} seleccionados`;
  } else {
    if (this._value == null) return '';
    const found = (this.ui.options ?? []).find(o => this.equals(this.getValue(o), this._value));
    return found ? this.getLabel(found) : String(this._value);
  }
}
get popoverBadgeText(): string {
  const sel = this.selectedArray.length;
  return sel > 0 ? `${sel} seleccionados` : '';
}


  get showCounterBadge(): boolean {
    return this.isMultiple && this.selectedArray.length > Number(this.ui.maxBadge);
  }
  get counterBadge(): string {
    const extra = this.selectedArray.length - Number(this.ui.maxBadge);
    return extra > 0 ? `+${extra}` : '';
  }

  // Estilos del host
  styleMap(): Record<string,string> {
    const base: Record<string,string> = {
      '--sel-height': this.ui.size === 'sm' ? '70px' : this.ui.size === 'lg' ? '100px' : '80px',
      '--sel-radius': '10px',
      '--sel-pad-x': '12px',
      '--sel-gap': '8px',
      '--sel-bg': 'var(--dialog-bg)',
      '--sel-border': 'var(--border-color)',
      '--sel-fg': 'var(--text-color)',
      '--sel-placeholder': 'var(--text-color-secondary)',
      '--sel-shadow': 'var(--shadow-color)',
    };
    const overrides = styleToNgStyle(this.ui.style);
    return mergeStyles(base, overrides);
  }

  hostClasses(): string[] {
    const v = `v-${this.ui.variant ?? 'outlined'}`;
    const s = `s-${this.ui.size ?? 'md'}`;
    const neu = `neu-${this.ui.neumorphism ?? 'flat'}`;
    const dis = this.ui.disabled ? 'is-disabled' : '';
    const inv = this.ui.invalid ? 'is-invalid' : '';
    const extra = this.ui.class ?? '';
    return ['ui-select', v, s, neu, dis, inv, extra].filter(Boolean);
  }
  // Reordenar en el POPOVER (usa el array completo de seleccionados)
onDropPopover(event: CdkDragDrop<any[]>) {
  if (!this.isMultiple || this.ui.disabled) return;
  const arr = [...this.selectedArray];
  moveItemInArray(arr, event.previousIndex, event.currentIndex);
  this._value = arr;
  this.onChange(this._value);
  this.syncHeaderState();
}

// Reordenar en el TRIGGER (solo chips visibles: 0..maxInline-1)
onDropTrigger(event: CdkDragDrop<any[]>) {
  if (!this.isMultiple || this.ui.disabled) return;

  const visible = this.selectedArray.slice(0, this.maxInline);
  const prevVal = visible[event.previousIndex];
  const currVal = visible[event.currentIndex];

  // indices reales dentro del arreglo completo
  const prevIndexFull = this.selectedArray.findIndex(v => this.equals(v, prevVal));
  const currIndexFull = this.selectedArray.findIndex(v => this.equals(v, currVal));

  if (prevIndexFull < 0 || currIndexFull < 0) return;

  const arr = [...this.selectedArray];
  moveItemInArray(arr, prevIndexFull, currIndexFull);

  this._value = arr;
  this.onChange(this._value);
  this.syncHeaderState();
}

}

