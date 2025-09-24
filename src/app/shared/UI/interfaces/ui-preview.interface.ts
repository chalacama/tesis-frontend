// ui-preview.interface.ts
import { UiButtonProps } from "./ui-button.interface";
import { MaskingProps, UiDialogProps } from "./ui-dialog.interface";
import { UiIconProps } from "./ui-icon.interface";
import { UiFileType, UiMediaProps, UiStyleProps } from "./ui-presets.interface";

export interface UiPreviewProps  extends UiMediaProps   {
    id?: string;
    previewClass?: string;
    previewStyle?: UiStyleProps;
    overlay?: boolean;   
    icon?: UiIconProps;
    mask?: boolean;
    masking?: MaskingProps;
    dialog?: UiDialogProps;
    types?: UiFileType;
}

