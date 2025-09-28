// ui-tabs.interface.ts
import { UiStyleProps } from "./ui-presets.interface"; 

export interface UiTabsProps  {
  id?: string;
  class?: string;   
  style?: UiStyleProps;
  scrollable?: boolean;
}
