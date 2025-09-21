import { Directive, Input } from '@angular/core';
import { UiIconProps } from '../interfaces/ui-icon.interface';
import { UiPopoverProps } from '../interfaces/ui-popover.interface';
import { UiA11Props, UiFormProps, UiStyleProps } from '../interfaces/ui-presets.interface';

export type SelectType = 'disappear' | 'ifta' | 'float';

@Directive({
  selector: '[uiUiSelect]',
  standalone: true,
})
export class UiSelectDirective implements UiA11Props, UiFormProps {
  // === UiProps / UiFormProps ===
  @Input() severity?: UiFormProps['severity'] = 'primary';
  @Input() size?: UiFormProps['size'] = 'md';
  @Input() disabled?: UiFormProps['disabled'] = false;
  @Input() neumorphism?: UiFormProps['neumorphism'] = 'flat';
  @Input() variant?: UiFormProps['variant'] = 'outlined';
  @Input() invalid?: UiFormProps['invalid'] = false;

  // === UiA11Props ===
  @Input() ariaLabel?: string;
  @Input() role?: string = 'combobox';
  @Input() tabIndex?: number = 0;
  @Input() ariaPressed?: boolean;
  @Input() title?: string;
  @Input() onKeyDown?: ('enter' | 'space')[];

  // === UiSelectProps ===
  @Input() id?: string;
  @Input() placeholder?: string = 'Selecciona...';
  @Input() editable?: boolean = false;
  @Input() showClear?: boolean = false;

  @Input() selectClass?: string;
  @Input() selectStyle?: UiStyleProps;

  @Input() icon?: UiIconProps;
  @Input() popover?: UiPopoverProps;

  @Input() options?: any[] = [];
  @Input() optionLabel?: string = 'label';
  @Input() optionValue?: string | number = 'value';

  @Input() multiple?: boolean = false;
  @Input() filter?: boolean = false;

  @Input() max!: number | string; // requerido por tu interfaz
  @Input() type?: SelectType = 'float';
}

