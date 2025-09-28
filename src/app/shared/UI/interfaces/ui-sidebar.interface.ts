// ui-sidebar.interface.ts
import { MaskingProps } from "./ui-dialog.interface";
import { UiOverlayProps, UiStyleProps} from "./ui-presets.interface";


export interface UiSidebarProps  extends UiOverlayProps {
  id?: string;
  class?: string;
  style?: UiStyleProps;
  drawer?: boolean;
  visible?: boolean;
  minimize?: boolean;
  expand?: boolean;
  minimizeWidth?: string;
  expandWidth?: string;
  mask?: Omit<MaskingProps, 'showBnt' | 'button'>;
  position?: 'left' | 'right';
}

