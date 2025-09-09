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

  // ===== Icono (IconProps) =====
  @Input() svgPath?: UiButtonProps['svgPath'];
  @Input() iconSeverity?: UiButtonProps['iconSeverity'] = 'secondary';
  @Input() iconSize?: UiButtonProps['iconSize'] = 'sm'; // sm | md | lg
  @Input() iconClass?: UiButtonProps['iconClass'];
  @Input() iconStyle?: UiButtonProps['iconStyle'];

  // ===== Badge (BadgeProps) =====
  @Input() badge?: UiButtonProps['badge'] = false;
  @Input() badgeValue?: UiButtonProps['badgeValue'];
  @Input() badgeSeverity?: UiButtonProps['badgeSeverity'] = 'danger';
  @Input() badgeSize?: UiButtonProps['badgeSize'] = 'sm';     // sm | md | lg
  @Input() badgeClass?: UiButtonProps['badgeClass'];
  @Input() badgeStyle?: UiButtonProps['badgeStyle'];
}
