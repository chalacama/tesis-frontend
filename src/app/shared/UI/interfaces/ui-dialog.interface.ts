// ui-dialog.interface.ts

import { UiButtonProps } from "./ui-button.interface";
import { UiIconProps } from "./ui-icon.interface";
import { UiA11Props, UiProps, UiStyleProps, UiTypeBg } from "./ui-presets.interface";
export type DialogType   = 
    'image' | 
    'free'  
    
export interface UiDialogProps extends MaskingProps , UiProps , UiA11Props {
    id?: string;
    dialogClass?: string;
    dialogStyle?: UiStyleProps;    
    visible?: boolean; // sirve cerrar y abrir el dialog
    type: DialogType; 
    closeOnMaskClick?: boolean; // sirve para indicarle que si les das clic en el fondo se cierre
    closeOnEsc?: boolean; // sirve para indicarle que si les das clic en la tecla ESC se cierre
    mask?: boolean; // sirve para indicarle que si dea una mascara de fondo
}
export type MaskingType   = 
    'transparent' |           
    'dimmed' |
    'blur'
export interface MaskingProps  {
    id?: string;
    maskClass?: string;
    maskStyle?: UiStyleProps;
    maskType?: MaskingType;
    visibleBnt?: boolean;
    buttons?: UiButtonProps[];
    icons?: UiIconProps[];
    
}
