// ui-avatar.interface.ts
import { UiBadgeProps } from "./ui-icon.interface";
import { UiA11Props, UiMediaProps, UiProps, UiStyleProps } from "./ui-presets.interface";


export interface UiAvatarProps extends UiA11Props , UiMediaProps {
    id?: string
    avatarClass?: string
    avatarStyle?: UiStyleProps;
    name?: string
    badge?: UiBadgeProps;
}