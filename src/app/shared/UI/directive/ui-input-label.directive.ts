import { Directive, Input } from '@angular/core';
import { UiInputLabelProps } from '../interfaces/ui-input-label.interface';

@Directive({
  selector: '[uiInputLabel]'
})
export class UiInputLabelDirective {

  // ===== UiFormProps =====
  @Input() severity?: UiInputLabelProps['severity'] = 'primary';
  @Input() size?: UiInputLabelProps['size'] = 'sm';
  @Input() disabled: UiInputLabelProps['disabled'] = false;
  @Input() invalid: UiInputLabelProps['invalid'] = false;

  // ===== Label (UiLabelProps) =====
  @Input() label: UiInputLabelProps['label'] = '';
  @Input() labelClass?: UiInputLabelProps['labelClass'];
  @Input() labelStyle?: UiInputLabelProps['labelStyle'];

  // ===== Input base =====
  @Input() inputClass?: UiInputLabelProps['inputClass'];
  @Input() inputStyle?: UiInputLabelProps['inputStyle'];
  @Input() placeholder?: UiInputLabelProps['placeholder'];
  @Input() type: UiInputLabelProps['type'] = 'text';              
  @Input() variant: UiInputLabelProps['variant'] = 'outlined'; 
  @Input() autoSize: UiInputLabelProps['autoSize'] = true;

  // ===== Counter (UiCounterProps) =====
  @Input() max?: UiInputLabelProps['max'];
  @Input() min?: UiInputLabelProps['min'];
  @Input() counter: UiInputLabelProps['counter'] = false;
  @Input() counterClass?: UiInputLabelProps['counterClass'];
  @Input() counterStyle?: UiInputLabelProps['counterStyle'];

  // ===== A11Y (UiA11Props) =====
  @Input() ariaLabel?: UiInputLabelProps['ariaLabel'];
  @Input() role?: UiInputLabelProps['role'];
  @Input() tabIndex?: UiInputLabelProps['tabIndex'] = 0;
  @Input() ariaPressed?: UiInputLabelProps['ariaPressed'];
  @Input() title?: UiInputLabelProps['title'];

  constructor() { }

}
