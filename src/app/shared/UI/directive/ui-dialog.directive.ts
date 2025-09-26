// ui-dialog.directive.ts
import { Directive, Input, Output , EventEmitter } from '@angular/core';
import { UiDialogProps } from '../interfaces/ui-dialog.interface';

interface EventMap<T> {
  [eventName: string]: T[];
}
type VisibleChangeEvent = { visible: boolean[] };


/**
 * SOLO inputs. Sin lógica.
 * La lógica (abrir/cerrar, eventos, ESC, etc.) vive en el DialogComponent.
 */
@Directive({
  selector: '[uiDialog]',
  standalone: true,
  exportAs: 'uiDialog'
})
export class UiDialogDirective {
  // ======== Estado ========
  @Input() visible: UiDialogProps['visible'] = false;
  @Input() type: UiDialogProps['type'] = 'free';
  /* @Output() visibleChange = new EventEmitter<VisibleChangeEvent>(); */
  @Output() visibleChange = new EventEmitter<boolean>();
  // ======== Tokens base (UiProps) ========
  @Input() severity?: UiDialogProps['severity'] = 'primary';
  @Input() size?: UiDialogProps['size'] = 'sm';
  @Input() disabled?: UiDialogProps['disabled'] = false;
  @Input() neumorphism?: UiDialogProps['neumorphism'] = 'flat';
  @Input() variant?: UiDialogProps['variant'] = 'filled';

  // ======== A11y (UiA11Props) ========
  @Input() ariaLabel?: UiDialogProps['ariaLabel'];
  @Input() role?: UiDialogProps['role'];
  @Input() tabIndex?: UiDialogProps['tabIndex'];
  @Input() ariaPressed?: UiDialogProps['ariaPressed'];
  @Input() title?: UiDialogProps['title'];

  // ======== Diálogo (contenedor/panel) ========
  @Input() class?: UiDialogProps['class'];
  @Input() style?: UiDialogProps['style'];

  // ======== Comportamiento de cierre ========
  @Input() closeOnMaskClick: UiDialogProps['closeOnMaskClick'] = true;
  @Input() closeOnEsc: UiDialogProps['closeOnEsc'] = true;

  // ======== Máscara (backdrop) ========
  @Input() showMask: UiDialogProps['showMask'] = true;
  @Input() mask?: UiDialogProps['mask'] = {
    type: 'blur',
    showBnt: true
  };
  @Input() showBtn?: UiDialogProps['showBnt'] = true;

}
