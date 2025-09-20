import { UiIconProps } from "./ui-icon.interface";
import { UiPopoverProps } from "./ui-popover.interface";
import { UiA11Props, UiFormProps, UiStyleProps } from "./ui-presets.interface";

// ui-select.interface.ts
export interface UiSelectProps extends UiA11Props, UiFormProps  {
    id?: string;
    placeholder?: string;
    editable?: boolean;
    showClear?: boolean;
    selectClass?: string;
    selectStyle?: UiStyleProps;
    icon?: UiIconProps;
    popover?: UiPopoverProps;
    options?: any[];
    optionLabel?: string;
    optionValue?: string | number;
    
}   