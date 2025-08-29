import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[uiCheckbox]',
  standalone: true,
})
export class UiCheckboxDirective {
  /** Texto del label al lado del checkbox */
  @Input() label: string | null = null;

  /** Fondo cuando está marcado (override opcional) */
  @Input() bgChecked?: string;
}

