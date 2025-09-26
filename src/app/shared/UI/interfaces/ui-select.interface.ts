// ui-select.interface.ts
import { UiIconProps } from "./ui-icon.interface";
import { UiPopoverProps } from "./ui-popover.interface";
import { UiA11Props, UiFormProps, UiStyleProps } from "./ui-presets.interface";

export type SelectType = 'disappear' | 'ifta' | 'float' ; //es para el placeholder  

// disappear = desaparacer cuando se selecciona
// ifta = no desaparece y se mantiene en el lugar dentro del input
// float = no desaparece y se queda floteando fuera del input
export interface UiSelectProps extends UiA11Props, UiFormProps  {
    id?: string;
    placeholder?: string;
    editable?: boolean;
    showClear?: boolean;
    class?: string;
    style?: UiStyleProps;
    icon?: UiIconProps;
    popover?: UiPopoverProps;
    options?: any[];
    optionLabel?: string;
    optionValue?: string | number;
    multiple?: boolean;
    filter?: boolean;
    max: number | string;
    type?: SelectType;
}  