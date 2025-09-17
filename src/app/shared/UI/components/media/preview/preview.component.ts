// preview.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { UiPreviewDirective } from '../../../directive/ui-preview.directive';
import { DialogComponent } from '../../overlay/dialog/dialog.component'; // <ui-dialog>
import { IconComponent } from '../../button/icon/icon.component';       // <ui-icon>
import { UiFileType, UiSeverity, UiSize } from '../../../interfaces/ui-presets.interface';
import { mergeStyles, styleToNgStyle } from '../../../utils/style.utils';

@Component({
  selector: 'ui-preview',
  standalone: true,
  imports: [CommonModule, DialogComponent, IconComponent],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css'],
  hostDirectives: [{
    directive: UiPreviewDirective,
    inputs: [
      // UiMediaProps / UiProps
      'src','alt','types','severity','size','disabled','neumorphism','variant',
      // UiPreviewProps
      'previewClass','previewStyle','overlay','icon','mask','masking','dialog'
    ],
  }]
})
export class PreviewComponent {
  /** Estado interno del diálogo */
  readonly isDialogOpen = signal<boolean>(false);

  /** Inyectamos la instancia de la directiva para leer inputs */
  constructor(public readonly pv: UiPreviewDirective) {}

  /** Se puede abrir: overlay ON, no disabled, hay src y es image */
  readonly canOpen = computed<boolean>(() => {
    const t = this.pv.types ?? ('image' as UiFileType);
    const hasSrc = !!this.pv.src;
    return !this.pv.disabled && (this.pv.overlay ?? true) && hasSrc && t === 'image';
  });

  /** Banana binding compatible, pero forzando cierre si overlay = false */
  get dialogVisible(): boolean {
    return (this.pv.overlay ?? true) ? this.isDialogOpen() : false;
  }
  set dialogVisible(v: boolean) {
    this.isDialogOpen.set((this.pv.overlay ?? true) ? v : false);
  }

  /** Handlers del diálogo */
  openDialog(): void {
    if (!this.canOpen()) return;
    this.isDialogOpen.set(true);
  }
  closeDialog(): void {
    this.isDialogOpen.set(false);
  }
  toggleDialog(): void {
    if (!this.canOpen()) return;
    this.isDialogOpen.update(v => !v);
  }

  /** Cierre desde la máscara del diálogo (respeta closeOnMaskClick) */
  onMaskClick(): void {
    const allowClose = this.pv.dialog?.closeOnMaskClick ?? true;
    if (allowClose) this.closeDialog();
  }

  /** Click en overlay (ojito). No propaga y abre solo si overlay = true */
  tryOpenFromOverlayClick(ev?: Event): void {
    ev?.stopPropagation();
    if (!this.pv.overlay) return;
    this.openDialog();
  }

  /** Evitar que clics en <ng-content> abran el diálogo */
  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }
  private cssVars(): Record<string, string> {
      const sev: UiSeverity = (this.pv.severity as UiSeverity) ?? 'primary';
      const sizeTok = this.sizeTokens(this.pv.size as UiSize);
  
      // Espera que tengas definidos en :root algo como:
      // --sev-primary, --sev-primary-hover, etc.
      const sevBg = `var(--sev-${sev})`;
      const sevBgHover = `var(--sev-${sev}-hover, ${sevBg})`;
      const sevBorder = `var(--sev-${sev})`;
  
  
      return {
        '--pv-width': 'auto',
        '--pv-height': sizeTok.height,
        '--pv-radius': '10px',
        '--pv-gap': sizeTok.gap,
        '--pv-font-size': sizeTok.font,
        '--btn-shadow': sizeTok.shadow,
        '--btn-shadow-contrast': sizeTok.shadowContrast,
        '--btn-pad-x': sizeTok.padX,
        '--btn-bg': sevBg,
        '--pv-bg-hover': sevBgHover,
        '--pv-fg': (sev === 'secondary') ? 'var(--text-color, #111)' : 'var(--text-color-contrast, #fff)',
        '--pv-border': sevBorder,
        '--pv-border-width': '2px',
        
      };
    }
    private sizeTokens(size: UiSize | undefined) {
    const s = size ?? 'md';
    return {
      height: s === 'sm' ? '34px' : s === 'lg' ? '48px' : '40px',
      padX:  s === 'sm' ? '12px' : s === 'lg' ? '20px' : '16px',
      gap:   s === 'sm' ? '6px'  : s === 'lg' ? '10px' : '8px',
      font:  s === 'sm' ? '.85rem' : s === 'lg' ? '1.05rem' : '.95rem',
      shadow : s === 'sm' ? '1px 2px 6px' : s === 'lg' ? '4px 6px 10px' : '2px 4px 8px',
      shadowContrast : s === 'sm' ? '0px -1px 3px' : s === 'lg' ? '3px -4px 5px' : '2px -2px 4px',
      iconPx:s === 'sm' ? '16px' : s === 'lg' ? '24px' : '20px',

    
    };
  }
  styleMap(): Record<string, string> {
    const baseVars = this.cssVars();                   // tus --btn-*
    const overrides = styleToNgStyle(this.pv.previewStyle);
    return mergeStyles(baseVars, overrides);
  }
    /* styleMapMask(): Record<string, string> {
    const baseVars = this.cssVars();                   // tus --btn-*
    const overrides = styleToNgStyle(this.pv.);
    return mergeStyles(baseVars, overrides);
  } */
}
