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
  @Input() label: UiInputLabelProps['label'];

  // ===== Input base =====
  @Input() class?: UiInputLabelProps['class'];
  @Input() style?: UiInputLabelProps['style'];
  @Input() placeholder?: UiInputLabelProps['placeholder'];
  @Input() type: UiInputLabelProps['type'] = 'text';              
  @Input() variant: UiInputLabelProps['variant'] = 'outlined'; 
  @Input() autoSize: UiInputLabelProps['autoSize'] = true;

  // ===== Counter (UiCounterProps) =====
  @Input() max?: UiInputLabelProps['max'];
  @Input() min?: UiInputLabelProps['min'];
  @Input() counter: UiInputLabelProps['counter'];

  // ===== A11Y (UiA11Props) =====
  @Input() ariaLabel?: UiInputLabelProps['ariaLabel'];
  @Input() role?: UiInputLabelProps['role'];
  @Input() tabIndex?: UiInputLabelProps['tabIndex'] = 0;
  @Input() ariaPressed?: UiInputLabelProps['ariaPressed'];
  @Input() title?: UiInputLabelProps['title'];
  // showCounter
  @Input() showCounter: UiInputLabelProps['showCounter'] = true;

  constructor() { }

}
