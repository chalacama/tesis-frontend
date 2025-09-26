// ui-icon.interface.ts
import { UiProps, UiStyleProps } from "./ui-presets.interface";
export interface UiIconProps extends UiProps {
  id?: string;
  svgPath?: string;
  class?: string;
  style?: UiStyleProps;
  
}
export interface UiBadgeProps extends UiProps {
  id?: string;
  class?: string;
  style?: UiStyleProps;
  value?: string | number;
}