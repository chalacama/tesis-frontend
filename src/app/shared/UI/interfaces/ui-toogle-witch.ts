// interfaces/ui-toggle-witch.ts
import { UiSeverity, UiSize } from './ui-presets.interface';

export type UiTWVariant = 'solid' | 'soft' | 'outline';

export interface UiToggleWitchProps {
  // Etiqueta opcional a la izquierda/derecha
  label?: string;

  // Texto inline opcional dentro del switch (corto)
  onLabel?: string;
  offLabel?: string;

  // Variante visual del switch
  variant?: UiTWVariant;

  // Layout
  reverse?: boolean; // etiqueta a la derecha por defecto; si true, a la izquierda
  dense?: boolean;   // reduce paddings

  // Estado de error opcional (borde/ayuda visual)
  error?: boolean;

  // Accesibilidad
  ariaLabel?: string;

  // Heredados de presets (para tipado)
  severity?: UiSeverity;
  size?: UiSize;
  disabled?: boolean;
  raised?: boolean;
}



