// ui-popover.interface.ts
import { UiA11Props, UiPosition, UiProps, UiStyleProps } from "./ui-presets.interface";
export type PopoverType   = 
    'pointer' | 'plain'
    

export interface UiPopoverProps extends Omit<UiProps ,'size'> ,UiA11Props  {
    id?: string;
    class?: string;
    style?: UiStyleProps;
    visible?: boolean;
    type: PopoverType;
    position?: UiPosition; 
}