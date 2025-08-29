import { Directive, Input } from '@angular/core';
import { UiBtnProps } from '../interfaces/ui-botton';

@Directive({
  selector: '[uiBotton]'
})
export class UiBottonDirective {

  constructor() { }

  // Button Inputs
  @Input() label: UiBtnProps['label'] = '';
  @Input() badge: UiBtnProps['badge'];
  @Input() badgeSeverity: UiBtnProps['badgeSeverity'] = 'danger';
  @Input() type: UiBtnProps['type'] = 'button';
  @Input() svgPath?: UiBtnProps['svgPath'];
  @Input() iconOnly: UiBtnProps['iconOnly'] = false;
  @Input() variant?: UiBtnProps['variant'] = 'filled';


}
