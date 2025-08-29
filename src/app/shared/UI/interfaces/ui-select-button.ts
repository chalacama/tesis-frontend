// shared/UI/interfaces/ui-select-button.ts
export type SBBasicValue = string | number | boolean;

export type UiSBVariant = 'segmented' | 'loose' | 'tabs';

export interface SBBasicOption {
  value: SBBasicValue;
  label: string;
  /** Desactiva SOLO esta opción (diferente del disabled global del control) */
  disabled?: boolean;

  /** Overrides por opción (opcionales) */
  color?: string;       // color activo/foco
  bg?: string;          // fondo hover/selección
  borderColor?: string; // borde base
}

/** Props propias del SelectButton (además de los presets globales) */
export interface UiSBProps {
  label?: string;
  options?: SBBasicOption[];
  orientation?: 'horizontal' | 'vertical';
  wrap?: boolean;
  shape?: 'rounded' | 'pill';
  error?: string | null;

  /** Variantes específicas del select */
  variant?: UiSBVariant;

  /** Si true, el grupo aparece "encerrado" en un panel con fondo/borde */
  boxed?: boolean;
}

