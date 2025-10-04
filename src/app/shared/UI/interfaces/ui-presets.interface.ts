// ui-presets.interface.ts
export type UiSeverity = 'primary' | 'secondary' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';
export type UiSize =
  | 'sm'  //  Small: compacto, ideal para espacios reducidos o móvil
  | 'md'  //  Medium: tamaño estándar por defecto
  | 'lg'; //  Large: más grande, para botones destacados o pantallas amplias
export type UiPosition    = 'top' | 'right' |'bottom' | 'left' | 'center' | UiCorner;
export type UiOrientation   = 'horizontal' | 'vertical';
export type UiFileType = 'document' | 'video' | 'image';
export type UiFileFormat = 'pdf' | 'mp4' | 'jpg' | 'png' | 'gif';

export const UiFileFormats: Record<UiFileType, UiFileFormat[]> = {
  document: ['pdf'],
  video: ['mp4'],
  image: ['jpg', 'png', 'gif'],
}


export type UiVariant =
  | 'flat'      // Estilo plano: sin borde ni relleno extra, minimalista
  | 'filled'    // Estilo sólido: fondo coloreado según el severity
  | 'outlined'; // Estilo con borde: borde visible y fondo transparente
export type UiNeumorphism =
  | 'flat'        // Estilo plano, sin sombras (default base)
  | 'pressed'     // Componente "hundido" en la superficie
  | 'raised'      // Componente "elevado" con sombra externa
  | 'convex'      // Apariencia de botón abultado (saliendo hacia afuera)
  | 'concave'     // Apariencia de botón hundido (hacia adentro)

export type UiCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type UiTypeBg = 'solid' | 'transparent' | 'gradient' | 'none';

export interface UiProps {
  severity?: UiSeverity;
  size?: UiSize;          
  disabled?: boolean;
  neumorphism?: UiNeumorphism;
  variant?: UiVariant;   
  skeleton?: boolean;
}
export interface UiOverlayProps  {          
  neumorphism?: UiNeumorphism;
  variant?: UiVariant;
  skeleton?: boolean;
}
export interface UiPanelProps  {          
  neumorphism?: UiNeumorphism;
  variant?: UiVariant;
}
/* extends Pick<UiProps, 'neumorphism'> {
   Ereda solo la propiedad que nombras
} */
/* extends Omit<UiProps, 'neumorphism'> {
   Omito la propiedad que nombras
} */
export interface UiFormProps extends UiProps {   
  invalid?: boolean;     
}
export interface UiMediaProps extends UiProps {
  src?: string;
  alt?: string ;
  
  
}
export interface UiA11Props {
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
  ariaPressed?: boolean;  
  title?: string;      
}

export interface UiStyleProps {
  // overrides
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  borderWidth?: string;
  boxShadow?: string;
  opacity?: number | string;
  cursor?: string;
  width?: string;
  height?: string;

// posicion
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number | string;

  // Animation
  transition?: string;

  display?: string;
  justifyContent?: string;
  alignItems?: string;
  flexDirection?: string;
  
}

