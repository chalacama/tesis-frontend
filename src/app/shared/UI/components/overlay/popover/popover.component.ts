import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild, inject } from '@angular/core';
import { UiPopoverDirective } from '../../../directive/ui-popover.directive';
import { UiSeverity } from '../../../interfaces/ui-presets.interface';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';

@Component({
  selector: 'ui-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.css',
  hostDirectives: [{
    directive: UiPopoverDirective,
    inputs: [
      'severity','disabled','variant','neumorphism',
      'ariaLabel','role','tabIndex','ariaPressed','title',
      'id','povClass','povStyle','visible','type','position'
    ],
    outputs: ['visibleChange'] // re-exporta el output de la DIRECTIVA
  }]
})
export class PopoverComponent {
  @Input() closeOnOutside = true;
  @Input() closeOnInside = true;

  private host = inject(ElementRef<HTMLElement>);

  // referencia al panel real para el contains()
  @ViewChild('panel', { static: false }) panelRef?: ElementRef<HTMLElement>;

  constructor(public readonly pov: UiPopoverDirective) {}

  // ---- CIERRE FUERA (ahora sí decorando el método correcto) ----
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.pov.visible || !this.closeOnOutside) return;

    // const target = ev.target as Node;
    const target = ev.target as HTMLElement;
    const panelEl = this.panelRef?.nativeElement;

    // Si no hay panel en el DOM (porque *ngIf lo sacó), no hay nada que cerrar
    if (!panelEl) return;

    // Si el click NO fue dentro del panel => cerrar
    if (!panelEl.contains(target)) {
      this.pov.visibleChange.emit(false);
    }
  }

  // ---- CIERRE DENTRO ----
  onInsideClick(ev: MouseEvent) {
    if (!this.pov.visible) return;
    if (this.closeOnInside) {
      this.pov.visibleChange.emit(false);
    }
    ev.stopPropagation();
  }

  // === ===

  private cssVars(): Record<string, string> {
    const sev: UiSeverity = (this.pov.severity as UiSeverity) ?? 'primary';
    const bg = `var(--popover-bg)`;
    const border = `var(--sev-${sev})`;
    const shadow = `var(--shadow-color)`;
    return {
      '--pov-bg': bg,
      '--pov-border': border,
      '--pov-radius': '7px',
      '--pov-shadow': shadow ,
      '--pov-z': '200',
      '--pov-arrow-size': '10px',
      '--pov-pad': '0px',
      '--pov-minw': '100px',
      '--pov-maxw': '-' + (this.pov.povStyle?.width ?? '400px')
    };
  }

  styleMap(): Record<string, string> {
    const base = this.cssVars();
    const overrides = styleToNgStyle(this.pov.povStyle);
    return mergeStyles(base, overrides);
  }

  hostClasses(): string[] {
    const v = `v-${this.pov.variant ?? 'filled'}`;
    const neu = `neu-${this.pov.neumorphism ?? 'flat'}`;
    const post = `post-${this.pov.position ?? 'bottom-left'}`;
    const sev = `s-${this.pov.severity ?? 'primary'}`;
    const vis = this.pov.visible ? 'is-visible' : 'is-hidden';
    const t = this.pov.type === 'pointer' ? 't-pointer' : 't-plain';
    const extra = this.pov.povClass ?? '';
    const dis = this.pov.disabled ? 'is-disabled' : '';
    
    return ['ui-pov', v, neu, sev, vis, t, dis, extra,post].filter(Boolean);
  }
}
