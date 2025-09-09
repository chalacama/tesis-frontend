// ui-file-upload.directive.ts
import { Directive, Input } from '@angular/core';
import { UifileUploadProps } from '../interfaces/ui-file-upload.interface';

@Directive({
  selector: '[uiFileUpload]',
  standalone: true,
  exportAs: 'uiFileUpload'
})
export class UiFileUploadDirective {
  // ===== Base (UifileUploadProps) =====
  @Input() alt?: UifileUploadProps['alt'] = '';
  @Input() type?: UifileUploadProps['type'] = 'image';           // 'pdf' | 'video' | 'image'
  @Input() variant?: UifileUploadProps['variant'] = 'filled';     // 'filled' | 'outlined'
  @Input() position?: UifileUploadProps['position'] = 'top'; // 'top' | 'bottom' | 'left' | 'right'
  @Input() label?: UifileUploadProps['label'] = '';
  @Input() urlMiniature?: UifileUploadProps['urlMiniature'];

  // ===== Tokens base (UiFormProps) =====
  @Input() severity?: UifileUploadProps['severity'] = 'primary';
  @Input() size?: UifileUploadProps['size'] = 'sm';               // 'sm' | 'md' | 'lg'
  @Input() disabled?: UifileUploadProps['disabled'] = false;
  @Input() invalid?: UifileUploadProps['invalid'] = false;

  // ===== Botón contenedor (UibtnProps) =====
  @Input() btnClass?: UifileUploadProps['btnClass'];
  @Input() btnStyle?: UifileUploadProps['btnStyle'];

  // ===== Accesibilidad (UiA11Props) =====
  @Input() ariaLabel?: UifileUploadProps['ariaLabel'];
  @Input() role?: UifileUploadProps['role'] = 'button';
  @Input() tabIndex?: UifileUploadProps['tabIndex'] = 0;
  @Input() ariaPressed?: UifileUploadProps['ariaPressed'];
  @Input() title?: UifileUploadProps['title'];

  // ===== Icono (IconProps) =====
  @Input() svgPath?: UifileUploadProps['svgPath'];
  @Input() iconClass?: UifileUploadProps['iconClass'];
  @Input() iconStyle?: UifileUploadProps['iconStyle'];

  // ===== Estilos/Clases del File Upload (propias del componente) =====
  @Input() fudClass?: UifileUploadProps['fudClass'];
  @Input() fudStyle?: UifileUploadProps['fudStyle'];
}
