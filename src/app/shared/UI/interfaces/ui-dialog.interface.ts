// ui-dialog.interface.ts

import { UiButtonProps } from "./ui-button.interface";
import { UiIconProps } from "./ui-icon.interface";
import { UiA11Props, UiProps, UiStyleProps, UiTypeBg } from "./ui-presets.interface";
export type DialogType   = 
    'image' | 
    'free'  
    
export interface UiDialogProps extends  UiProps , UiA11Props {
    id?: string;
    class?: string;
    style?: UiStyleProps;    
    visible?: boolean; // sirve cerrar y abrir el dialog
    type: DialogType; 
    closeOnMaskClick?: boolean; // sirve para indicarle que si les das clic en el fondo se cierre
    closeOnEsc?: boolean; // sirve para indicarle que si les das clic en la tecla ESC se cierre
    showMask?: boolean; // sirve para indicarle que si dea una mascara de fondo
    mask?: MaskingProps; // props de la mascara
    showBnt?: boolean;
    // sirve para indicarle que si muestre el boton de cerrar
}
export type MaskingType   = 
    'transparent' |           
    'dimmed' |
    'blur'
export interface MaskingProps  {
    id?: string;
    class?: string;
    style?: UiStyleProps;
    type?: MaskingType;
    showBnt?: boolean ;
    button?: UiButtonProps;
}
