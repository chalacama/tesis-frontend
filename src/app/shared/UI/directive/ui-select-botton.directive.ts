// shared/UI/directive/ui-select-botton.directive.ts
import { Directive, Input } from '@angular/core';
import { UiSbtnProps } from '../interfaces/ui-select-button';


@Directive({
  selector: '[uiSelectBotton]',
  standalone: true,
})
export class UiSelectBottonDirective {
  // ===== UiSbtnProps =====
  @Input() id?: UiSbtnProps['id'];
  @Input() btns?: UiSbtnProps['btns'];
  @Input() orientation?: UiSbtnProps['orientation'] = 'horizontal';
  @Input() options?: UiSbtnProps['options'];
  @Input() optionLabel?: UiSbtnProps['optionLabel'];
  @Input() multiple?: UiSbtnProps['multiple'] = false;
  @Input() optionValue?: UiSbtnProps['optionValue'];

  // ===== UiFormProps =====
  @Input() invalid?: UiSbtnProps['invalid'] = false;
  @Input() severity?: UiSbtnProps['severity'] = 'primary';
  @Input() size?: UiSbtnProps['size'] = 'sm';
  @Input() disabled?:UiSbtnProps['disabled'] = false;
  @Input() neumorphism?: UiSbtnProps['neumorphism'] = 'flat';
  @Input() variant?: UiSbtnProps['variant'] = 'filled';

  // ===== UiA11Props (Omit<'onKeyDown'>) =====
  @Input() ariaLabel?: UiSbtnProps['ariaLabel'];
  @Input() role?:UiSbtnProps['role'];
  @Input() tabIndex?: UiSbtnProps['tabIndex'];
  @Input() ariaPressed?: UiSbtnProps['ariaPressed'];
  @Input() title?: UiSbtnProps['title'];
}
