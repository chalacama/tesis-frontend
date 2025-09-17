import { Directive, Input } from '@angular/core';
import { UiButtonProps } from '../interfaces/ui-button.interface';

@Directive({
  selector: '[uiButton]',
  standalone: true,
  exportAs: 'uiButton'
})
export class UiButtonDirective {
  // ===== Base del botón =====
  @Input() label: UiButtonProps['label'] = '';
  @Input() type: UiButtonProps['type'] = 'button';
  @Input() variant: UiButtonProps['variant'] = 'filled';
  @Input() link?: UiButtonProps['link'];
  @Input() neumorphism?: UiButtonProps['neumorphism'] = 'flat';

  // ===== Tokens base ( UibtnProps) =====
  @Input() severity?: UiButtonProps['severity'];
  @Input() size?: UiButtonProps['size'] = 'sm';
  @Input() disabled: UiButtonProps['disabled'] = false;
  @Input() btnClass?: UiButtonProps['btnClass'];
  @Input() btnStyle?: UiButtonProps['btnStyle'];


  // ===== Accesibilidad (UiA11Props) =====
  @Input() ariaLabel?: UiButtonProps['ariaLabel'];
  @Input() role?: UiButtonProps['role'];
  @Input() tabIndex?: UiButtonProps['tabIndex'] = 0;
  @Input() ariaPressed?: UiButtonProps['ariaPressed'];
  @Input() title?: UiButtonProps['title'];
  @Input() onKeyDown?: UiButtonProps['onKeyDown'];

  @Input() icon?: UiButtonProps['icon'];

  // ===== Badge (BadgeProps) =====
  @Input() badge?: UiButtonProps['badge'] = false;
  @Input() badgeValue?: UiButtonProps['badgeValue'];
  @Input() badgeSeverity?: UiButtonProps['badgeSeverity'] = 'danger';
  @Input() badgeSize?: UiButtonProps['badgeSize'] = 'sm';     // sm | md | lg
  @Input() badgeClass?: UiButtonProps['badgeClass'];
  @Input() badgeStyle?: UiButtonProps['badgeStyle'];
}
