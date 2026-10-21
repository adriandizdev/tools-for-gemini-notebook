/** Nombre que se propone para un documento de la página (REQ-002, RN-06 y RN-07). */

const EXTENSION = /\.(pdf|docx|pptx)$/i;
const FALLBACK_NAME = 'Documento';

/** Último segmento de la ruta, con los `%xx` ya convertidos al carácter original. */
export function fileNameFromUrl(url: string): string {
  let segment: string;
  try {
    segment = new URL(url).pathname.split('/').pop() ?? '';
  } catch {
    return '';
  }
  try {
    return decodeURIComponent(segment);
  } catch {
    // Un `%` suelto deja el segmento sin decodificar.
    return segment;
  }
}

/**
 * RN-06: sin extensión, `_ - . +` como espacios, sin más símbolos que letras (con acentos y ñ)
 * y números, y sin espacios repetidos. Ej.: `Informe_anual-2025%20(v2).pdf` → "Informe anual 2025 v2".
 */
export function proposedName(url: string): string {
  const name = fileNameFromUrl(url)
    .replace(EXTENSION, '')
    .replace(/[_\-.+]/g, ' ')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return name || FALLBACK_NAME;
}

/** RN-07 (REQ-003, RN-03): si el usuario deja el nombre vacío, se usa el propuesto. */
export function sourceName(edited: string, proposed: string): string {
  return edited.trim() || proposed;
}
