// directive/ui-toggle-witch.directive.ts
import { Directive, Input } from '@angular/core';
import { UiToggleWitchProps } from '../interfaces/ui-toogle-witch';

@Directive({
  selector: '[appUiToogleWitch]',
  standalone: true
})
export class UiToogleWitchDirective {
  /** ===== UiFormProps / UiProps ===== */
  @Input() severity: UiToggleWitchProps['severity'] = 'primary';
  @Input() size: UiToggleWitchProps['size'] = 'md';
  @Input() disabled: UiToggleWitchProps['disabled'] = false;
  @Input() neumorphism: UiToggleWitchProps['neumorphism'] = 'flat';
  @Input() variant: UiToggleWitchProps['variant'] = 'filled';
  @Input() invalid: UiToggleWitchProps['invalid'] = false;

  /** ===== A11y (sin onKeyDown) ===== */
  @Input() ariaLabel: UiToggleWitchProps['ariaLabel'] = 'Toggle';
  @Input() role: UiToggleWitchProps['role'] = 'switch';
  @Input() tabIndex: UiToggleWitchProps['tabIndex'] = 0;
  @Input() ariaPressed: UiToggleWitchProps['ariaPressed'] = undefined;
  @Input() title: UiToggleWitchProps['title'] = undefined;

  /** ===== Propias del toggle ===== */
  @Input() type: UiToggleWitchProps['type'] = 'switch';
  @Input() tggWClass: UiToggleWitchProps['tggWClass'] = '';
  @Input() tggWStyle: UiToggleWitchProps['tggWStyle'] = undefined;
}



