// button.component.ts
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiPresetsDirective } from '../../../directive/ui-presets.directive';
import { UiSeverity } from '../../../interfaces/ui-types';
import { UiBottonDirective } from '../../../directive/ui-botton.directive';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  hostDirectives: [{
    directive: UiPresetsDirective,
    // re-exporta inputs para usarlos directamente en <app-button ...>
    inputs: [
      'severity','size','disabled','raised',
      'width','height','radius','fontSize','gap',
      'bg','fg','hoverBg','borderColor','borderWidth','iconSize',
      'ariaLabel'
    ],
    
  },
  {directive: UiBottonDirective
    // re-exporta inputs para usarlos directamente en <app-button ...>
    ,inputs: [
      'label','badge','badgeSeverity','type','svgPath','iconOnly','variant'
    ]
  }
  
],
})
export class ButtonComponent implements OnChanges {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  // inyecta instancia del directive para leer valores actuales si necesitas lógica interna
  readonly presets = inject(UiPresetsDirective);
  /* readonly btn = inject(UiBottonDirective); */
  constructor(public readonly btn: UiBottonDirective) {
    this.ngOnChanges();
   }
  
  
  safeSvg?: SafeHtml;

  ngOnChanges(): void {
    
    if (this.btn.svgPath) {
      this.http.get(this.btn.svgPath, { responseType: 'text' }).subscribe(raw => {
        let svg = raw.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
        if (!/fill="/i.test(svg)) svg = svg.replace('<svg', '<svg fill="currentColor"');
        this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
      });
    }
  }

  /** CSS variables unificadas: severidad → tokens, más overrides específicos */
  cssVars(): Record<string, string> {
    const p = this.presets;

    // Map de severidad → tokens globales definidos en :root (tu style.css)
    // Usamos --sev-<name> y --sev-<name>-hover que ya tienes.
    const sev = p.severity;
    const sevBg       = `var(--sev-${sev})`;
    const sevBgHover  = `var(--sev-${sev}-hover)`;
    const sevBorder   = `var(--sev-${sev})`;
    // Color de texto: por defecto contrast; puedes ajustar reglas si quieres casos especiales
    const defaultFg   = (sev === 'secondary') ? 'var(--text-color)' : 'var(--text-color-contrast)';

    // Badge severity
    const badgeBg = `var(--sev-${this.btn.badgeSeverity})`;
    const badgeFg = 'var(--text-color-contrast)';

    // Tamaños por size (si no hay overrides)
    const height =
      p.height ?? (p.size === 'sm' ? '34px' : p.size === 'lg' ? '48px' : '40px');
    const iconSize =
      p.iconSize ?? (p.size === 'sm' ? '16px' : p.size === 'lg' ? '24px' : '20px');
    const padX =
      p.size === 'sm' ? '12px' : p.size === 'lg' ? '20px' : '16px';
    const gap =
      p.gap ?? (p.size === 'sm' ? '6px' : p.size === 'lg' ? '10px' : '8px');

    const vars: Record<string, string> = {
      '--btn-width': p.width ?? 'auto',
      '--btn-height': height,
      '--btn-radius': p.radius ?? '10px',
      '--btn-gap': gap,
      '--btn-font-size': p.fontSize ?? (p.size === 'sm' ? '.85rem' : p.size === 'lg' ? '1.05rem' : '.95rem'),
      '--btn-icon-size': iconSize,
      '--btn-pad-x': padX,

      '--btn-bg': p.bg ?? sevBg,
      '--btn-bg-hover': p.hoverBg ?? sevBgHover,
      '--btn-fg': p.fg ?? defaultFg,
      '--btn-border': p.borderColor ?? sevBorder,
      '--btn-border-width': p.borderWidth ?? '2px',

      '--btn-badge-bg': badgeBg,
      '--btn-badge-fg': badgeFg,
    };

    return vars;
  }

  hostClasses(): string[] {
    const p = this.presets;
    return [
      `v-${this.btn.variant}`,
      `s-${p.size}`,
      p.raised ? 'is-raised' : '',
      p.disabled ? 'is-disabled' : ''
    ];
  }
}
