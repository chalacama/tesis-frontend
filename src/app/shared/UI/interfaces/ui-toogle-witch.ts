// interfaces/ui-toggle-witch.ts
import { UiIconProps } from './ui-icon.interface';
import { UiA11Props, UiFormProps, UiStyleProps } from './ui-presets.interface';

export type ToggWType = 'switch' | 'button';

export interface UiToggleWitchProps extends UiFormProps , UiA11Props {  
  id?: string;
  type?: ToggWType;
  class?: string;
  style?: UiStyleProps;
  onLabel?: string | number;
  offLabel?: string | number;
  onIcon?: UiIconProps;
  offIcon?: UiIconProps;

}



