// ui-icon.interface.ts
import { UiSeverity, UiSize, UiStyleProps } from "./ui-presets.interface";

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
export interface BadgeProps {
  badge?: boolean;
  badgeSeverity?: UiSeverity;  
  badgeSize?: UiSize;
  badgeClass?: string;
  badgeStyle?: UiStyleProps;
  badgeValue?: string | number;
}