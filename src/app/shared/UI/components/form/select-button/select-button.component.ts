import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export type SBBasicValue = string | number | boolean;
export interface SBBasicOption {
  value: SBBasicValue;
  label: string;
  disabled?: boolean;
  iconUrl?: string;
  color?: string;       // color principal (texto/borde active + foco)
  bg?: string;          // fondo hover/selección opcional
  borderColor?: string; // color de borde base opcional
  
}

@Component({
  selector: 'select-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-button.component.html',
  styleUrls: ['./select-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectButtonComponent),
    multi: true
  }]
})
export class SelectButtonComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() options: SBBasicOption[] = [];
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() wrap = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() shape: 'rounded' | 'pill' = 'rounded';
  @Input() disabled = false;
  @Input() error: string | null = null;
  @Input() borderRadius?: string | number;
  @Output() selectionChange = new EventEmitter<SBBasicValue>();

  value!: SBBasicValue | null;

  // CVA
  onChange: (val: SBBasicValue | null) => void = () => {};
  onTouched: () => void = () => {};
  writeValue(val: SBBasicValue | null): void { this.value = val; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  selectOption(opt: SBBasicOption) {
    if (this.disabled || opt.disabled) return;
    this.value = opt.value;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
    this.onTouched();
  }

  isChecked(opt: SBBasicOption) { return this.value === opt.value; }

  get radiusValue(): string | null {
    if (this.borderRadius === undefined || this.borderRadius === null) return null;
    return typeof this.borderRadius === 'number' ? `${this.borderRadius}px` : this.borderRadius;
  }
}
