// ui-select-button.interface.ts
import { UiButtonProps } from "./ui-button.interface";
import { UiA11Props, UiFormProps, UiOrientation } from "./ui-presets.interface";

export interface UiSbtnProps extends UiFormProps , Omit<UiA11Props, 'onKeyDown'> {
  id?: string;
  btns?: UiButtonProps[];
  orientation?: UiOrientation;
  options?: any[];
  optionLabel?: string;
  multiple?: boolean;
  optionValue?: string | number;
}

