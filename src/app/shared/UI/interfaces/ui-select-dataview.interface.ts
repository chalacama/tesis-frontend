
import { UiIconProps } from "./ui-icon.interface";
import { UiA11Props, UiFormProps, UiStyleProps } from "./ui-presets.interface";

// ui-select-dataview.interface.ts
export interface UiSelectDataviewProps extends UiFormProps , UiA11Props {
    id?: string;
    editable?: boolean;
    showClear?: boolean;
    sdvClass?: string;
    sdvStyle?: UiStyleProps;
    icon?: UiIconProps; // es para el input de filtro
    options?: any[];
    optionLabel?: string;
    optionValue?: string | number;
    optionSrc?: string;
    multiple?: boolean; 
    filter?: boolean;
    max: number | string; // el maximo de opciones que se puedo seleccionar
    optionStyle?: UiStyleProps;
    columns?: number | string;
}
