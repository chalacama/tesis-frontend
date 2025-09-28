// ui-button-nav.interface.ts

import { UiUnderlineProps } from "./ui-icon.interface";
import { UiA11Props, UiProps, UiStyleProps } from "./ui-presets.interface";

export interface UiButtonNavProps extends UiA11Props ,UiProps {
   id?: string;
   showUnderline?: boolean;
   activeUnderline?: boolean;
   underline?: UiUnderlineProps;
   class?: string;
   style?: UiStyleProps;
}

