// ui-loading-bar.interface.ts
import { MaskingProps } from "./ui-dialog.interface";


export interface UiLoadingBarProps {
    visible: boolean;
    mask?: MaskingProps;
    spinner?: boolean;
    bar?: boolean;
}