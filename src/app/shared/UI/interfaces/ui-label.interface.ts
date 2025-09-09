import { UiStyleProps } from "./ui-presets.interface";

export interface UiLabelProps {
    label: string;
    labelClass?: string;
    labelStyle?: UiStyleProps;
}

export interface UiLabelArray {
    label: string [];
    labelClass?: string [];
    labelStyle?: UiStyleProps[];
}