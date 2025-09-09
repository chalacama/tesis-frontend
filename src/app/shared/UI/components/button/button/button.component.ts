import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiButtonDirective } from '../../../directive/ui-button.directive';
import { UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  hostDirectives: [{
    directive: UiButtonDirective,
    // Re-exportamos TODOS los inputs de la directiva para usarlos como <ui-button ...>
    inputs: [
      'label','type','variant',
      'severity','size','disabled','btnClass','btnStyle',
      'ariaLabel','role','tabIndex','ariaPressed','title','onKeyDown',
      'svgPath','iconSeverity','iconSize','iconClass','iconStyle',
      'badge','badgeSeverity','badgeSize','badgeClass','badgeStyle','badgeValue'
    ]
  }]
})
export class ButtonComponent implements OnChanges {

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  // instancia de la directiva para leer los valores actuales
  constructor(public readonly btn: UiButtonDirective) {
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
    } else {
      this.safeSvg = undefined;
    }
   
  }

  /** Map de tamaños -> tokens por defecto */
  private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      height: s === 'sm' ? '34px' : s === 'lg' ? '48px' : '40px',
      padX:  s === 'sm' ? '12px' : s === 'lg' ? '20px' : '16px',
      gap:   s === 'sm' ? '6px'  : s === 'lg' ? '10px' : '8px',
      font:  s === 'sm' ? '.85rem' : s === 'lg' ? '1.05rem' : '.95rem',
      iconPx:s === 'sm' ? '16px' : s === 'lg' ? '24px' : '20px',
      badgefontSize: s === 'sm' ? '0.70rem' : s === 'lg' ? '.80rem' : '0.75rem',
      badgePx: this.btn.badgeValue ? (s === 'sm' ? '18px' : s === 'lg' ? '23px' : '29px') : (s === 'sm' ? '5px' : s === 'lg' ? '10px' : '15px')
    };
  }

  /** Variables CSS (usando severidad/size) + fallback a custom properties globales */
  private cssVars(): Record<string, string> {
    const sev: UiSeverity = (this.btn.severity as UiSeverity) ?? 'primary';
    const sizeTok = this.sizeTokens(this.btn.size as UiSize);

    // Espera que tengas definidos en :root algo como:
    // --sev-primary, --sev-primary-hover, etc.
    const sevBg = `var(--sev-${sev})`;
    const sevBgHover = `var(--sev-${sev}-hover, ${sevBg})`;
    const sevBorder = `var(--sev-${sev})`;

    const badgeSev: UiSeverity = (this.btn.badgeSeverity as UiSeverity) ?? sev;
    const badgeBg = `var(--sev-${badgeSev})`;

    const iconSizeByUiSize = this.btn.iconSize ? this.sizeTokens(this.btn.iconSize as   UiSize).iconPx : sizeTok.iconPx;

    return {
      '--btn-width': 'auto',
      '--btn-height': sizeTok.height,
      '--btn-radius': '10px',
      '--btn-gap': sizeTok.gap,
      '--btn-font-size': sizeTok.font,
      '--btn-icon-size': iconSizeByUiSize,
      '--btn-pad-x': sizeTok.padX,
      '--btn-bg': sevBg,
      '--btn-bg-hover': sevBgHover,
      '--btn-fg': (sev === 'secondary') ? 'var(--text-color, #111)' : 'var(--text-color-contrast, #fff)',
      '--btn-border': sevBorder,
      '--btn-border-width': '2px',
      '--btn-badge-bg': badgeBg,
      '--btn-badge-fg': 'var(--text-color-contrast, #fff)',
      '--btn-badge-font': sizeTok.badgefontSize,
      '--btn-badge-size': sizeTok.badgePx,
      '--btn-badge-top-right': this.btn.badgeValue ? '-6px' : '6px'
    };
  }

styleMap(): Record<string, string> {
  const baseVars = this.cssVars();                   // tus --btn-*
  const overrides = styleToNgStyle(this.btn.btnStyle);
  return mergeStyles(baseVars, overrides);
}
  hostClasses(): string[] {
    const v = `v-${this.btn.variant ?? 'filled'}`;
    const s = `s-${this.btn.size ?? 'md'}`;
    /* const raised = this.btn.raised ? 'is-raised' : ''; */
    const dis = this.btn.disabled ? 'is-disabled' : '';
    const extra = this.btn.btnClass ?? '';
    return ['app-btn', v, s, dis, extra].filter(Boolean);
  }

  /** Soporte para Enter/Espacio si onKeyDown incluye esos valores */
  handleKeydown(ev: KeyboardEvent) {
    if (!this.btn.onKeyDown || this.btn.disabled) return;
    const key = ev.key.toLowerCase();
    if (key === 'enter' && this.btn.onKeyDown.includes('enter')) {
      (ev.target as HTMLElement)?.dispatchEvent(new Event('click', { bubbles: true }));
      ev.preventDefault();
    } else if ((key === ' ' || key === 'spacebar') && this.btn.onKeyDown.includes('space')) {
      (ev.target as HTMLElement)?.dispatchEvent(new Event('click', { bubbles: true }));
      ev.preventDefault();
    }
  }
}
