// interfaces/ui-toggle-witch.ts
import { UiIconProps } from './ui-icon.interface';
import { UiA11Props, UiFormProps, UiSeverity, UiSize, UiStyleProps } from './ui-presets.interface';

export type ToggWType = 'switch' | 'button';

export interface UiToggleWitchProps extends UiFormProps , Omit<UiA11Props, 'onKeyDown'> {  
  type?: ToggWType;
  tggWClass?: string;
  tggWStyle?: UiStyleProps;
  onLabel?: string | number;
  offLabel?: string | number;
  onIcon?: UiIconProps;
  offIcon?: UiIconProps;
}



