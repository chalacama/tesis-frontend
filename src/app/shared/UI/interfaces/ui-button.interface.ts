// ui-botton.interface.ts
import { BadgeProps, IconProps } from "./ui-icon.interface";
import { UiA11Props, UiNeumorphism, UiProps, UiSeverity, UiSize, UiStyleProps, UiVariant } from "./ui-presets.interface";

export type BtnTypes   = 'button' | 'submit' | 'reset';  

export interface UibtnProps {  
  btnClass?: string;
  btnStyle?: UiStyleProps;
}
export interface UibtnArray {  
  btnClass?: string[];
  btnStyle?: UiStyleProps[];
}
export interface UiButtonProps extends UiProps, BadgeProps , IconProps , UiA11Props ,UibtnProps {         
  type?: BtnTypes;          
  /* variant?: UiVariant; */
  link?: string;
  /* severity?: UiSeverity; */
  /* size?: UiSize;      */     
  /* disabled?: boolean; */
  label?: string;    
} 


