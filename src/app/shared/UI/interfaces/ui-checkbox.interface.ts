// ui-checkbox.interface.ts
import { UiA11Props, UiFormProps, UiStyleProps } from "./ui-presets.interface";
export type CheckboxType   =  
    'row' |
    'column'
export interface UiCheckboxProps extends UiFormProps, UiA11Props {
    id?: string;
    class?: string;
    style?: UiStyleProps;
    type?: CheckboxType;
    checked?: boolean;
    indeterminate?: boolean;
}