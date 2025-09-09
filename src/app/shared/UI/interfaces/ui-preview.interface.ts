import { UiProps, UiStyleProps } from "./ui-presets.interface";

// ui-preview.interface.ts
export type UiPreviewVariant = 'filled' | 'outlined' | 'none';
export type UiPreviewType = 'video' | 'image' | 'document';
export type UiPreviewFormat = 'video' | 'image' | 'document';
export interface UiPreviewProps  extends UiProps {
    previewClass?: string;
    previewStyle?: UiStyleProps;
    previewUrl?: string;
    btnStyles?: UiStyleProps[];
}
