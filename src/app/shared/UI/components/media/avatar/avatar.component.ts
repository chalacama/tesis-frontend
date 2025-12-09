// src/app/shared/ui/components/avatar/avatar.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, input, Input, OnChanges } from '@angular/core';
import { UiAvatarDirective } from '../../../directive/ui-avatar.directive';
import { UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css'],
  hostDirectives: [{
    directive: UiAvatarDirective,
    inputs: [
      // Avatar base
      'id','class','style','name','src','alt',
      // UiProps heredados
      'severity','size','disabled','neumorphism','variant',
      // A11y
      'ariaLabel','role','tabIndex','ariaPressed','title',
      // Badge
      'badge'
    ]
  }]
})
export class AvatarComponent implements OnChanges {
  
  constructor() {
    // No es recomendable llamar a ngOnChanges en el constructor manualmente, 
    // pero si lo dejas, asegúrate de resetear el error.
    this.imgError = false;
    this.initials = this.buildInitials(this.av.name);
  }
  public readonly av = inject(UiAvatarDirective);
  
  /** Iniciales calculadas cuando no hay src */
  @Input() set name(val: string | undefined) {
      this.av.name = val;
    }
  initials = '';
  
  ngOnChanges(): void {
    
    // IMPORTANTE: Cada vez que cambien los datos, reseteamos el error
    // para intentar cargar la nueva imagen.
    this.imgError = false;
    this.initials = this.buildInitials(this.av.name);
    
  }

   buildInitials(name?: string): string {
    
   
    if (!name) return '';
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2); // máx 2 letras
     
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('');
  }

  /** Map de tamaños -> tokens por defecto */
  private sizeTokens(size?: UiSize) {
    const s = (size ?? 'md') as UiSize;
    return {
      px:      s === 'sm' ? '32px' : s === 'lg' ? '56px' : '42px',
      font:    s === 'sm' ? '.80rem' : s === 'lg' ? '1.05rem' : '.95rem',
      badgePx: s === 'sm' ? '14px'  : s === 'lg' ? '20px'  : '16px',
      badgeFont: s === 'sm' ? '.65rem' : s === 'lg' ? '.8rem' : '.72rem',
      ring:    s === 'sm' ? '2px' : s === 'lg' ? '3px' : '2.5px',
      shadow : s === 'sm' ? '1px 2px 4px' : s === 'lg' ? '4px 8px 12px' : '2px 4px 8px',
    };
  }

  /** Variables CSS según severidad/size */
  private cssVars(): Record<string, string> {
    const sev: UiSeverity = (this.av.severity as UiSeverity) ?? 'secondary';
    const sizeTok = this.sizeTokens(this.av.size as UiSize);

    const bg = `var(--sev-${sev}, var(--sev-secondary))`;
    const fg = sev === 'secondary'
      ? 'var(--text-color, #111)'
      : 'var(--text-color-contrast, #fff)';

    const badgeSev: UiSeverity = (this.av.badge?.severity as UiSeverity) ?? sev;
    const badgeBg = `var(--sev-${badgeSev}, ${bg})`;
    const badgeFg = 'var(--text-color-contrast, #fff)';

    return {
      '--av-size': sizeTok.px,
      '--av-font': sizeTok.font,
      '--av-radius': '50%',
      '--av-bg': bg,
      '--av-fg': fg,
      '--av-shadow': sizeTok.shadow,
      '--av-ring': sizeTok.ring,

      '--av-badge-size': sizeTok.badgePx,
      '--av-badge-font': sizeTok.badgeFont,
      '--av-badge-bg': badgeBg,
      '--av-badge-fg': badgeFg,
      '--av-badge-offset': '0px',
    };
  }

  /** Estilos finales combinando overrides del input avatarStyle */
  styleMap(): Record<string, string> {
    const baseVars = this.cssVars();
    const overrides = styleToNgStyle(this.av.style);
    return mergeStyles(baseVars, overrides);
  }

  hostClasses(): string[] {
    const s   = `s-${this.av.size ?? 'md'}`;
    const neu = `neu-${this.av.neumorphism ?? 'flat'}`;
    const v   = `v-${this.av.variant ?? 'filled'}`;
    const dis = this.av.disabled ? 'is-disabled' : '';
    const extra = this.av.class ?? '';
    return ['app-avatar', s, neu, v, dis, extra].filter(Boolean);
  }

  /* hasImg(): boolean {
    return !!this.av.src;
  } */
  imgError = false;
  // Modifica o agrega este método para manejar el error de carga
  handleImgError() {
    this.imgError = true;
  }

  hasImg(): boolean {
    // Ahora solo decimos que tiene imagen si hay SRC y NO ha dado error
    return !!this.av.src && !this.imgError;
  }

  /** Soporte de teclado como en tu botón */

}

