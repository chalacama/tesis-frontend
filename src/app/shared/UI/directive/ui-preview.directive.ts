// ui-preview.directive.ts
import { Directive, Input } from '@angular/core';
import { UiPreviewProps } from '../interfaces/ui-preview.interface';
import { UiFileType, UiSize } from '../interfaces/ui-presets.interface';

@Directive({
  selector: '[uiPreview]',
  standalone: true,
  exportAs: 'uiPreview'
})
export class UiPreviewDirective implements UiPreviewProps {
  // ===== UiMediaProps (hereda de UiProps) =====
  @Input() src?: UiPreviewProps['src'];
  @Input() alt?: UiPreviewProps['alt'];
  @Input() types: UiPreviewProps['types'] = 'image' as UiFileType;

  // ===== UiProps (tokens base) =====
  @Input() severity?: UiPreviewProps['severity'];
  @Input() size: UiPreviewProps['size'] = 'sm' as UiSize;
  @Input() disabled: UiPreviewProps['disabled'] = false;
  @Input() neumorphism?: UiPreviewProps['neumorphism'] = 'flat';
  @Input() variant: UiPreviewProps['variant'] = 'filled';

  // ===== UiPreviewProps =====
  @Input() class?: UiPreviewProps['class'];
  @Input() style?: UiPreviewProps['style'];

  /** Si es true, muestra overlay (ojito) y permite abrir el diálogo */
  @Input() overlay: UiPreviewProps['overlay'] = true;

  /** Icono del overlay (ojito) */
  @Input() icon?: UiPreviewProps['icon'];

  /** Bandera simple para máscara del diálogo */
  @Input() mask?: UiPreviewProps['mask'];

  /** Config avanzada de máscara (blur/dimmed/transparent + botones/íconos) */
  @Input() showMask?: UiPreviewProps['showMask'] = true;

  /** Config del diálogo (type, visible, closeOnMaskClick, etc.) */
  @Input() dialog?: UiPreviewProps['dialog'];
}

