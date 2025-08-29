// ui-botton
export type BtnVariant  = 'filled' | 'outlined' | 'text' | 'flat';
import { IconProps, UiSeverity } from "./ui-types";
export interface BadgeProps {
  badge?: string | number;
  badgeSeverity?: UiSeverity;
}
export interface UiBtnProps extends  BadgeProps , IconProps  {
  label?: string;
  type?: BtnTypes;
  variant?: BtnVariant;
}

export type BtnTypes    = 'button' | 'submit' | 'reset';
