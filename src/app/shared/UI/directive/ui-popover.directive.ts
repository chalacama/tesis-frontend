import { Directive, Input, Output,EventEmitter } from '@angular/core';
import { UiPopoverProps } from '../interfaces/ui-popover.interface';

@Directive({
  selector: '[uiPopover]'
})
export class UiPopoverDirective {

  @Input() severity?: UiPopoverProps['severity'] = 'primary';
  @Input() disabled: UiPopoverProps['disabled'] = false;
  @Input() variant: UiPopoverProps['variant'] = 'filled';
  @Input() neumorphism: UiPopoverProps['neumorphism'] = 'flat';

  /** ---- Props A11y (Omit<UiA11Props, 'onKeyDown'>) ---- */
  @Input() ariaLabel?: UiPopoverProps['ariaLabel'];
  @Input() role: UiPopoverProps['role'] = 'dialog';
  @Input() ariaPressed?: UiPopoverProps['ariaPressed'];
  @Input() title?: UiPopoverProps['title'];

  /** ---- Props específicas del popover ---- */
  @Input() id?: UiPopoverProps['id'];
  @Input() class?: UiPopoverProps['class'];
  @Input() style?: UiPopoverProps['style'];
  @Input() visible: UiPopoverProps['visible'] = false;
  @Input() position?: UiPopoverProps['position'] = 'bottom-left';

  /** Tipo de popover:
   *  'pointer' => con flecha apuntando al activador
   *  'plain'   => sin flecha
   */
  @Input() type: UiPopoverProps['type'] = 'pointer';
  
  @Output() visibleChange = new EventEmitter<boolean>();
}
