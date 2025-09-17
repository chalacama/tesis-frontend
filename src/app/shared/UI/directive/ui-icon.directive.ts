import { Directive, Input } from '@angular/core';
import { UiSeverity, UiSize, UiStyleProps } from '../interfaces/ui-presets.interface';
import { UiIconProps } from '../interfaces/ui-icon.interface';

/**
 * Directiva de icono: encapsula la API pública (inputs),
 * tokens de tamaño/severidad y mapeo de clases/estilos.
 * No renderiza nada por sí sola: el componente <ui-icon> o
 * un host con hostDirectives hará el render del SVG.
 */
@Directive({
  selector: '[uiIcon]',
  standalone: true,
  exportAs: 'uiIcon'
})
export class UiIconDirective {
  // === API Pública (props de icono) ===
  @Input() svgPath?: UiIconProps['svgPath'];
  @Input() severity?: UiIconProps['severity'] = 'secondary';
  @Input() size?: UiIconProps['size'] = 'md';         // 'sm' | 'md' | 'lg'
  @Input() iconClass?: UiIconProps['iconClass'];
  @Input() iconStyle?: UiIconProps['iconStyle'];

  // === Accesibilidad opcional ===
  @Input() ariaLabel?: string | null = null;
  @Input() role?: string | null = 'img';

  // === Tokens de tamaño ===
  private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      px:      s === 'sm' ? '16px' : s === 'lg' ? '24px' : '20px',
      gap:     s === 'sm' ? '4px'  : s === 'lg' ? '8px'  : '6px'
    };
  }

  // === Variables CSS derivadas (puedes extender) ===
  cssVars(): Record<string, string> {
    const tok = this.sizeTokens(this.size);
    const sev: UiSeverity = (this.severity as UiSeverity) ?? 'secondary';
    return {
      '--icon-size': tok.px,
      '--icon-gap': tok.gap,
      '--icon-color': `var(--sev-${sev}, currentColor)`,
    };
  }

  // === Clases del host (para estados/variantes) ===
  hostClasses(): string[] {
    const s = `s-${this.size ?? 'md'}`;
    const sev = `sev-${this.severity ?? 'secondary'}`;
    const extra = this.iconClass ?? '';
    return ['ui-icon', s, sev, extra].filter(Boolean);
  }
}

