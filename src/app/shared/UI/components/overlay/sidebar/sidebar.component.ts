import {
  Component, computed, effect, inject, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';
import { UiSidebarDirective } from '../../../directive/ui-sidebar.directive';

@Component({
  selector: 'ui-sidebar',
  standalone: true,
  imports: [CommonModule],
  //
  hostDirectives: [{
    directive: UiSidebarDirective,
    inputs: [
      'id','class','style',
      'neumorphism','variant',
      'visible','minimize',
      'minimizeWidth','expandWidth',
      'mask','position'
    ],
    
  }],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  // Directiva host (props/emitters)
  ui = inject(UiSidebarDirective);
  ismobile = window.innerWidth < 600;
  isTablet = window.innerWidth < 1024;

  // Variables CSS derivadas + overrides del prop style
  styleMap = computed(() => {
    const overrides = styleToNgStyle(this.ui.style);
    return mergeStyles( overrides);
  });







  hostClasses(): string[] {
 
    const post = `position-${this.ui.position ?? 'left'}`;
    /* const neu = `neu-${this.ui.neumorphism ?? 'flat'}`; */
    const v = `v-${this.ui.variant ?? 'filled'}`;
    const extra = this.ui.class ?? '';
    return ['ui-sidebar', extra,post,v].filter(Boolean);
  }
}
