// ui-toast.interface.ts
import { UiPosition, UiSeverity} from "./ui-presets.interface";

export interface UiToastProps  {
    message?: string;
    severity?: UiSeverity;
    position?: UiPosition;
    sticky?: boolean;
    lifetime?: number;
    summary?: string;
}