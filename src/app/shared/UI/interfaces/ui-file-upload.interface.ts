// ui-file-upload.interface.ts
import { UiButtonProps } from "./ui-button.interface";
import { UiIconProps } from "./ui-icon.interface";
import { UiA11Props, UiFileFormat, UiFileType, UiFormProps, UiOrientation, UiStyleProps, UiVariant } from "./ui-presets.interface";
import { UiPreviewProps } from "./ui-preview.interface";

export interface UifileUploadProps extends UiFormProps , Omit<UiA11Props, 'onKeyDown'> {
    id?: string;
    types?: UiFileType [];
    formats?: UiFileFormat[];
    variant?: UiVariant;
    orientation?: UiOrientation;
    label?: string;
    fudClass?: string;
    fudStyle?: UiStyleProps
    clearbtn: UiButtonProps;
    icon: UiIconProps;
    max?: number | string;
    min?: number | string;
    maxMb ?: number | string;
    minSecond ?: number | string;
    maxSecond ?: number | string;
    preview ?: UiPreviewProps;

}