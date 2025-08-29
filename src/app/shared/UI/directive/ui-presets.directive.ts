import { Directive, Input } from '@angular/core';
import { A11yProps, UiPresetProps, UiSpecificOverrides} from '../interfaces/ui-types';


@Directive({
  selector: '[uiPresets]',
  standalone: true,
})
export class UiPresetsDirective {
  // Presets
  // @Input() variant: UiPresetProps['variant'] = 'filled';
  @Input() severity: UiPresetProps['severity'] = 'primary';
  @Input() size: UiPresetProps['size'] = 'sm';
  @Input() disabled: UiPresetProps['disabled'] = false;
  @Input() raised: UiPresetProps['raised'] = false;

  // Overrides
  @Input() width: UiSpecificOverrides['width'];
  @Input() height: UiSpecificOverrides['height'];
  @Input() radius: UiSpecificOverrides['radius'];
  @Input() fontSize: UiSpecificOverrides['fontSize'];
  @Input() gap: UiSpecificOverrides['gap'];
  @Input() bg: UiSpecificOverrides['bg'];
  @Input() fg: UiSpecificOverrides['fg'];
  @Input() hoverBg: UiSpecificOverrides['hoverBg'];
  @Input() borderColor: UiSpecificOverrides['borderColor'];
  @Input() borderWidth: UiSpecificOverrides['borderWidth'];
  @Input() iconSize: UiSpecificOverrides['iconSize'];

  // Accesibilidad
  @Input() ariaLabel: A11yProps['ariaLabel'];
}
