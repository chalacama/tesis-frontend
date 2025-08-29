// shared/UI/directive/ui-select-botton.directive.ts
import { Directive, Input } from '@angular/core';
import { SBBasicOption, UiSBProps } from '../interfaces/ui-select-button';

@Directive({
  selector: '[uiSelectBotton]',
  standalone: true,
})
export class UiSelectBottonDirective implements UiSBProps {
  @Input() label: UiSBProps['label'] = '';
  @Input() options: SBBasicOption[] = [];
  @Input() orientation: UiSBProps['orientation'] = 'vertical';
  @Input() wrap: UiSBProps['wrap'] = true;
  @Input() shape: UiSBProps['shape'] = 'pill';
  @Input() error: UiSBProps['error'] = null;
  @Input() variant:UiSBProps['variant'] = 'loose';
  @Input() boxed: UiSBProps['boxed'] = false;
}

