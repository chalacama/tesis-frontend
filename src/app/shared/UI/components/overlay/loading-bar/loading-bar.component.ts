// loading-bar.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UiLoadingBarDirective } from '../../../directive/ui-loading-bar.directive';


@Component({
  selector: 'ui-loading-bar',
  standalone: true,
  imports: [CommonModule],
  hostDirectives: [{
    directive: UiLoadingBarDirective,
    inputs: ['visible', 'mask']
  }],
  templateUrl: './loading-bar.component.html',
  styleUrls: ['./loading-bar.component.css']
})
export class LoadingBarComponent {
  public readonly ui = inject(UiLoadingBarDirective);

}

