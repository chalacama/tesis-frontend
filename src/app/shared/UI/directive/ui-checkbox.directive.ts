import { Directive, Input } from '@angular/core';
import { UiCheckboxProps } from '../interfaces/ui-checkbox.interface';


export type CheckboxType = 'checkbox';

/** Directiva: solo inputs para el componente */
@Directive({
  selector: '[uiCheckbox]',
  standalone: true,
})
export class UiCheckboxDirective {
  // === UiProps / UiFormProps ===
  @Input() severity?: UiCheckboxProps['severity'] = 'primary';
  @Input() size?: UiCheckboxProps['size'] = 'sm';
  @Input() disabled?: UiCheckboxProps['disabled'] = false;
  @Input() neumorphism?: UiCheckboxProps['neumorphism'] = 'flat';
  @Input() variant?: UiCheckboxProps['variant'] = 'flat';
  @Input() invalid?: UiCheckboxProps['invalid'] = false;

  // === UiA11Props (sin onKeyDown) ===
  @Input() ariaLabel?: UiCheckboxProps['ariaLabel'];
  @Input() role?: UiCheckboxProps['role'] = 'checkbox';
  @Input() tabIndex?: UiCheckboxProps['tabIndex'] = 0;
  @Input() ariaPressed?: UiCheckboxProps['ariaPressed'];
  @Input() title?: UiCheckboxProps['title'];

  // === UiCheckboxProps ===
  @Input() id?: UiCheckboxProps['id'];
  @Input() class?: UiCheckboxProps['class'];
  @Input() style?: UiCheckboxProps['style'];
  @Input() type?: UiCheckboxProps['type'] = 'column';
  @Input() checked?: UiCheckboxProps['checked'] = false;
  @Input() indeterminate?: UiCheckboxProps['indeterminate'] = false;
}


