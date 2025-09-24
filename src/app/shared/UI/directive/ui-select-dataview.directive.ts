// src/app/shared/directives/ui-select-dataview.directive.ts
import { Directive, Input } from '@angular/core';
import { UiSelectDataviewProps } from '../interfaces/ui-select-dataview.interface';
import { UiIconProps } from '../interfaces/ui-icon.interface';
import { UiStyleProps } from '../interfaces/ui-presets.interface';

@Directive({
  selector: '[uiSelectDataview]',
  standalone: true,
})
export class UiSelectDataviewDirective {

  // === UiFormProps / UiProps ===
  @Input() severity?: UiSelectDataviewProps['severity'] = 'primary';
  @Input() size?: UiSelectDataviewProps['size'] = 'md';
  @Input() disabled?: UiSelectDataviewProps['disabled'] = false;
  @Input() neumorphism?: UiSelectDataviewProps['neumorphism'] = 'flat';
  @Input() variant?:UiSelectDataviewProps['variant'] = 'outlined';
  @Input() invalid?: UiSelectDataviewProps['invalid'] = false;

  // === A11y ===
  @Input() ariaLabel?: UiSelectDataviewProps['ariaLabel'];
  @Input() role?: UiSelectDataviewProps['role'] = 'listbox';
  @Input() tabIndex?: UiSelectDataviewProps['tabIndex'] = 0;
  @Input() ariaPressed?: UiSelectDataviewProps['ariaPressed'];
  @Input() title?: UiSelectDataviewProps['title'];
  @Input() onKeyDown?: UiSelectDataviewProps['onKeyDown'];

  // === Identificación / edición ===
  @Input() id?: UiSelectDataviewProps['id'];
  @Input() editable?: UiSelectDataviewProps['editable'] = false;
  @Input() showClear?: UiSelectDataviewProps['showClear'] = false;

  // === Estilos ===
  @Input() sdvClass?: UiSelectDataviewProps['sdvClass'];
  @Input() sdvStyle?: UiSelectDataviewProps['sdvStyle'];

  // === Icono del filtro ===
  @Input() icon?: UiSelectDataviewProps['icon'];

  // === Datos / opciones ===
  @Input() options?: UiSelectDataviewProps['options'] = [];
  @Input() optionLabel?: UiSelectDataviewProps['optionLabel'] = 'label';
  @Input() optionValue?: UiSelectDataviewProps['optionValue'] = 'value';
  @Input() optionSrc?: UiSelectDataviewProps['optionSrc']; // para imágenes/avatars

  // === Selección / filtro ===
  @Input() multiple?: UiSelectDataviewProps['multiple'] = false;
  @Input() filter?: UiSelectDataviewProps['filter'] = false;

  // === Límite de selección ===
  @Input() max!: UiSelectDataviewProps['max']; // number | string

  // === Estilos ===
  @Input() optionStyle?: UiSelectDataviewProps['optionStyle'];
  @Input() columns?: UiSelectDataviewProps['columns'] = 3;
}

