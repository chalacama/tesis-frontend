// ui-file-upload.interface.ts
import { UibtnProps } from "./ui-button.interface";
import { IconProps } from "./ui-icon.interface";
import { UiA11Props, UiFormProps, UiPosition, UiStyleProps } from "./ui-presets.interface";

export type UiFileUploadVariant = 'filled' | 'outlined';
export type UiFileTypes   = 'document' | 'video' |'image';
export const UiFileFormats: { [key in UiFileTypes]: string[] } = {
  document: ['pdf'],
  video: ['mp4'],
  image: ['jpg', 'png', 'gif']
};
export interface UiFileClear {
    btnClearLabel?: string;
    btnClearSvgPath?: string;
    btnClearClass?: string;
    btnClearStyle?: UiStyleProps
}
export interface UiFileOverlay {
    btnOverlaySvgPath?: string;
    btnOverlayClass?: string;
    btnOverlayStyle?: UiStyleProps
}
export interface UifileUploadProps extends UiFormProps , UiA11Props , UibtnProps , IconProps {
    alt?: string;
    type?: UiFileTypes;
    variant?: UiFileUploadVariant;
    position?: UiPosition;
    label?: string;
    fudClass?: string;
    fudStyle?: UiStyleProps
    urlMiniature?: string;
    // Nuevos atributos
    formats?: typeof UiFileFormats;
}