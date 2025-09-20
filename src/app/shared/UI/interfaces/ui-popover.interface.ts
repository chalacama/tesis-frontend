// ui-popover.interface.ts
import { UiA11Props, UiPosition, UiProps, UiStyleProps } from "./ui-presets.interface";
export type PopoverType   = 
    'pointer' | 'plain'
    

export interface UiPopoverProps extends Omit<UiProps ,'size'> ,Omit<UiA11Props, 'onKeyDown'>  {
    id?: string;
    povClass?: string;
    povStyle?: UiStyleProps;
    visible?: boolean;
    type: PopoverType;
    position?: UiPosition;
    
}