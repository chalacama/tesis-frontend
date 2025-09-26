// ui-select-button.interface.ts
import { UiButtonProps } from "./ui-button.interface";
import { UiA11Props, UiFormProps, UiOrientation } from "./ui-presets.interface";
import { UiSelectProps } from "./ui-select.interface";

export interface UiSbtnProps extends UiFormProps ,UiA11Props {
  id?: string;
  btns?: UiButtonProps[];
  orientation?: UiOrientation;
  options?: any[];
  optionLabel?: string;
  multiple?: boolean;
  optionValue?: string | number;
  class?: string;
  style?: UiSelectProps;
}

