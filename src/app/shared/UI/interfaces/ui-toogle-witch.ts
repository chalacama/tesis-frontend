// interfaces/ui-toggle-witch.ts
import { UiA11Props, UiFormProps, UiSeverity, UiSize, UiStyleProps } from './ui-presets.interface';

export type ToggWType = 'switch' | 'checkbox' | 'pill';

export interface UiToggleWitchProps extends UiFormProps , Omit<UiA11Props, 'onKeyDown'> {  
  type?: ToggWType;
  tggWClass?: string;
  tggWStyle?: UiStyleProps;
}



