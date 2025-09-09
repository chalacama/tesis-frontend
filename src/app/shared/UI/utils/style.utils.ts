// src/app/ui/utils/style.utils.ts

import { UiStyleProps } from "../interfaces/ui-presets.interface";


/** Convierte UiStyleProps (camelCase) a objeto para [ngStyle] (kebab-case).
 *  - Mantiene CSS custom properties (--var) tal cual.
 *  - Convierte numbers en string (por si envías opacity: 0.7).
 */
export function styleToNgStyle(s?: UiStyleProps): Record<string, string> {
  if (!s) return {};
  const out: Record<string, string> = {};

  for (const [key, val] of Object.entries(s)) {
    if (val === undefined || val === null) continue;

    // Deja las CSS variables como están: "--btn-gap", "--btn-height", etc.
    if (key.startsWith('--')) {
      out[key] = String(val);
      continue;
    }

    // camelCase -> kebab-case (fontSize -> font-size)
    const kebab = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
    out[kebab] = String(val);
  }
  return out;
}

/** Mezcla de estilos con prioridad de derecha a izquierda.
 *  Uso: mergeStyles(base, overridesA, overridesB)
 */
export function mergeStyles(
  ...maps: Array<Record<string, string> | undefined>
): Record<string, string> {
  const result = maps.reduce((acc, m) => (m ? { ...acc, ...m } : acc), {});
  return result ?? {}; // devuelve un objeto vacío si result es undefined
}
