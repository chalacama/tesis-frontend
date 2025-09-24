// ui-botton.interface.ts
import { UiBadgeProps, UiIconProps } from "./ui-icon.interface";
import { UiA11Props, UiProps, UiStyleProps } from "./ui-presets.interface";

export type BtnTypes   = 'button' | 'submit' | 'reset';  

export interface UiButtonProps extends UiProps , UiA11Props {  
  id?: string;  
  btnClass?: string;
  btnStyle?: UiStyleProps;       
  type?: BtnTypes;          
  link?: string;
  label?: string;
  icon?: UiIconProps;
  showBadge?: boolean;
  badge?: UiBadgeProps;
} 

