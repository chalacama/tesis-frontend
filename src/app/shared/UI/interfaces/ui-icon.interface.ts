// ui-icon.interface.ts
import { UiProps, UiSeverity, UiSize, UiStyleProps } from "./ui-presets.interface";

/* export interface IconProps {
  svgPath?: string;
  iconSeverity?: UiSeverity;
  iconSize?: UiSize;
  iconClass?: string;
  iconStyle?: UiStyleProps;
  
} */
export interface UiIconProps {
  id?: string;
  svgPath?: string;
  severity?: UiSeverity;
  size?: UiSize;
  iconClass?: string;
  iconStyle?: UiStyleProps;
  
}
export interface UiBadgeProps extends UiProps {
  id?: string;
  badgeClass?: string;
  badgeStyle?: UiStyleProps;
  value?: string | number;
}