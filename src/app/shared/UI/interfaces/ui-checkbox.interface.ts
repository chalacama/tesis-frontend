// ui-checkbox.interface.ts
import { UiA11Props, UiFormProps, UiProps, UiStyleProps } from "./ui-presets.interface";
export type CheckboxType   =  
    'row' |
    'column'
export interface UiCheckboxProps extends UiFormProps, Omit<UiA11Props, 'onKeyDown'> {
    id?: string;
    checkClass?: string;
    checkStyle?: UiStyleProps;
    type?: CheckboxType;
    checked?: boolean;
    indeterminate?: boolean;
}