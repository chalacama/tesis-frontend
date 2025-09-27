// ui-input-label.interface.ts

import { UiLabelProps } from "./ui-label.interface";
import { UiA11Props, UiFormProps, UiStyleProps, UiVariant } from "./ui-presets.interface";
/* export type inputLabelVariant = 'outlined' | 'filled' | 'standard'; */

export type UiInputType =
  // 🔹 Texto básico
  | 'text'       // Texto plano
  | 'textarea'   // Área de texto multilínea
  | 'password'   // Contraseña, oculta caracteres
  | 'search'     // Campo de búsqueda
  | 'email'      // Validación de formato email
  | 'url'        // Validación de URL
  | 'tel'        // Teléfono (patrón de número)

  // 🔹 Números y valores
  | 'number'     // Números con min/max
  | 'range'      // Slider con valores entre min y max

  // 🔹 Fechas y tiempo
  | 'date'       // Selector de fecha
  | 'datetime-local' // Fecha + hora local
  | 'month'      // Selección de mes
  | 'week'       // Selección de semana
  | 'time'       // Solo hora

  // 🔹 Selección booleana / múltiple
  | 'checkbox'   // Casilla de verificación
  | 'radio'      // Botón de opción única
  | 'select'     // Dropdown/select (si quieres manejarlo igual que input)

  // 🔹 Archivos y multimedia
  | 'file'       // Subida de archivos
  | 'image'      // Botón de envío con imagen
  | 'color'      // Selector de color


export interface UiInputLabelProps extends UiA11Props , UiFormProps   {
    class?: string;
    style?: UiStyleProps;
    placeholder?: string;
    type?: UiInputType ;
    variant?: UiVariant;
    autoSize?: boolean;
    counter?:  UiCounterProps;
    label?: UiLabelProps;
    max?: number;
   /*  min?: number; */
    showCounter?: boolean;
}
export interface UiCounterProps {
    class?: string;
    style?: UiStyleProps;
}

