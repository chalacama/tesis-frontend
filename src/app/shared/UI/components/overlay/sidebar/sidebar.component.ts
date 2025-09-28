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
  // ✅ La directiva vive en el HOST del componente y re-exporta sus props
  hostDirectives: [{
    directive: UiSidebarDirective,
    inputs: [
      'id','class','style',
      'neumorphism','variant',
      'drawer','visible','minimize','expand',
      'minimizeWidth','expandWidth',
      'mask','position'
    ],
    outputs: ['visibleChange','minimizeChange','expandChange']
  }],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  // Directiva host (props/emitters)
  ui = inject(UiSidebarDirective);

  // ===== Helpers de estado
  isOpen = computed(() => !!this.ui.visible);
  isDrawer = computed(() => !!this.ui.drawer);
  isMinimized = computed(() => !!this.ui.minimize);
  isExpanded = computed(() => this.ui.expand ?? true);

  // Ancho actual (minimized/expanded)
  currentWidth = computed(() => {
    const minW = this.ui.minimizeWidth ?? '72px';
    const expW = this.ui.expandWidth ?? '250px';
    return this.isMinimized() ? minW : expW;
  });

  // Variables CSS derivadas + overrides del prop style
  styleMap = computed(() => {
    const baseVars = this.cssVars();
    const overrides = styleToNgStyle(this.ui.style);
    return mergeStyles(baseVars, overrides);
  });

   cssVars() {
    return {
      // size
      '--sidebar-width': this.currentWidth(),
      // apariencia opcional según variant/neumorphism (si tu theme los usa)
      /* '--ui-sidebar-variant': this.ui.variant ?? 'filled',
      '--ui-sidebar-neu': this.ui.neumorphism ?? 'flat', */
      /* '--ui-sidebar-position': this.ui.position ?? 'left', */
    } as Record<string, string>;
  }

  // ====== API interna
  close() {
    if (this.ui.visible !== false) {
      this.ui.visible = false;
      this.ui.visibleChange.emit(false);
    }
  }
  open() {
    if (this.ui.visible !== true) {
      this.ui.visible = true;
      this.ui.visibleChange.emit(true);
    }
  }
  toggle() {
    this.ui.visible ? this.close() : this.open();
  }
  toggleMinimize() {
    const next = !this.isMinimized();
    this.ui.minimize = next;
    this.ui.minimizeChange.emit(next);
  }
  toggleExpand() {
    const next = !this.isExpanded();
    this.ui.expand = next;
    this.ui.expandChange.emit(next);
  }

  // Cerrar con Escape cuando es drawer
  @HostListener('document:keydown.escape', ['$event'])
  onEsc(ev: KeyboardEvent) {
    if (this.isDrawer() && this.isOpen()) {
      ev.stopPropagation();
      this.close();
    }
  }

  // Sincroniza width del body (útil si tu layout lo usa)
  _syncBodyPadding = effect(() => {
    const w = this.isOpen() && !this.isDrawer() ? this.currentWidth() : '0px';
    document.body.style.setProperty('--layout-sidebar-offset', w);
  });

  hostClasses(): string[] {
 
    const post = `position-${this.ui.position ?? 'left'}`;
    /* const neu = `neu-${this.ui.neumorphism ?? 'flat'}`; */
    const v = `v-${this.ui.variant ?? 'filled'}`;
    const extra = this.ui.class ?? '';
    return ['ui-sidebar', extra,post,v].filter(Boolean);
  }
}
