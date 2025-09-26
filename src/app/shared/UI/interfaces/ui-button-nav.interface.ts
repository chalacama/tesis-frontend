// ui-button-nav.interface.ts

import { UiA11Props, UiProps } from "./ui-presets.interface";

export interface UiButtonNavProps extends UiA11Props ,UiProps {
   id?: string;
   showUnderline?: boolean;
   activeUnderline?: boolean;
   underline?: UiUnderlineProps;
   class?: string;
   style?: object;
}

export interface UiUnderlineProps {
  id?: string;
  class?: string;
  style?: object;
}