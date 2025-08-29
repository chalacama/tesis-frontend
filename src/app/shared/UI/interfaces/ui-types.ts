// ui-types.ts
export type UiSeverity = 'primary' | 'secondary' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';
// export type UiVariant  = 'filled' | 'outlined' | 'text' | 'flat';
export type UiSize     = 'sm' | 'md' | 'lg';
export interface UiPresetProps {
  /** Variante de estilo (no confundir con 'raised' que sólo agrega sombra). */
  // variant?: UiVariant;
  /** Paleta/tema predefinido de tu app. */
  severity?: UiSeverity;
  /** Tamaño predefinido. */
  size?: UiSize;
  /** Desactivar interacción. */
  disabled?: boolean;
  /** Eleva (sombra) encima del variant. */
  raised?: boolean;
}

export interface UiSpecificOverrides {
  /** Overrides específicos de layout/estilo (opcionales) */
  width?: string;        // ej. '140px' | '100%'
  height?: string;       // ej. '40px'
  radius?: string;       // ej. '10px'
  fontSize?: string;     // ej. '14px'
  gap?: string;          // ej. '8px'
  /** Colores específicos (no confundir con severity). */
  bg?: string;           // background
  fg?: string;           // text color
  borderColor?: string;
  hoverBg?: string;
  /** Tamaño de icono */
  iconSize?: string;     // ej. '18px' | '1rem'
  /** Borde (para outlined u otros) */
  borderWidth?: string;  // ej. '2px'
}

export interface IconProps {
  /** Usar SVG por ruta */
  svgPath?: string;
  /** Sólo icono (sin label) */
  iconOnly?: boolean;
  /** Slots start/end en el template si quieres proyectar contenido */
}

export interface A11yProps {
  ariaLabel?: string;
  
}


