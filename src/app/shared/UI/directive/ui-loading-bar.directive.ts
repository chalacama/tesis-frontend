import { Directive, Input } from '@angular/core';
import { UiLoadingBarProps } from '../interfaces/ui-loading-bar.interface';

@Directive({
  selector: '[uiLoadingBar]'
})
export class UiLoadingBarDirective {

  @Input() visible?: UiLoadingBarProps['visible'] = false;
  @Input() mask?: UiLoadingBarProps['mask'];
  @Input() spinner?: UiLoadingBarProps['spinner'] = false;
  @Input() bar?: UiLoadingBarProps['bar'] = true;
  
}
