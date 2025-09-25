// ui-button-nav.interface.ts

import { UiA11Props, UiProps } from "./ui-presets.interface";

export interface UiButtonNavProps extends UiA11Props ,UiProps {
   id?: string;
   showUnderline?: boolean;
   activeUnderline?: number;
   underline?: UiUnderlineProps;
   buttonNavClass?: string;
   buttonNavStyle?: object;
}

export interface UiUnderlineProps {
  id?: string;
  underlineClass?: string;
  underlineStyle?: object;
}