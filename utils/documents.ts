/** Reglas para decidir qué documentos de la página se muestran (REQ-002, RN-01 a RN-05 y RN-14). */

import { fileNameFromUrl } from './document-name';
import type { ScannedItem } from './scan-page';

export type DocumentKind = 'pdf' | 'word' | 'powerpoint';

export interface DocumentCandidate {
  /** Dirección sin fragmento (`#…`): identifica el documento (RN-02). */
  url: string;
  fileName: string;
  kind: DocumentKind;
  /** Nombre propuesto, si no sale de la dirección: el título del tema de UNIR (REQ-003, RF-05). */
  title?: string;
  /** Solo los temas del visor de UNIR (REQ-003). */
  unirTopicId?: string;
}

/**
 * RN-01. Solo los formatos que Gemini Notebook admite (verificado el 2026-10-21): los antiguos
 * `.doc` y `.ppt` no se listan.
 */
const KIND_BY_EXTENSION: Record<string, DocumentKind> = {
  pdf: 'pdf',
  docx: 'word',
  pptx: 'powerpoint',
};

/** Extensión con la que se sube cada tipo: Gemini Notebook la exige en el nombre del fichero. */
export const EXTENSION_BY_KIND: Record<DocumentKind, string> = {
  pdf: 'pdf',
  word: 'docx',
  powerpoint: 'pptx',
};

/** Parámetros con los que los visores (Google Docs, PDF.js…) reciben el documento que muestran. */
const VIEWER_PARAMS = ['url', 'file', 'src'];

export function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    parsed.hash = '';
    return parsed.href;
  } catch {
    return null;
  }
}

/** Tipo de documento según la extensión de la ruta, o `null` si no es un documento. */
export function documentKind(url: string): DocumentKind | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  const extension = /\.([a-z]+)$/i.exec(pathname)?.[1]?.toLowerCase();
  return extension ? (KIND_BY_EXTENSION[extension] ?? null) : null;
}

/** Si `url` es un visor que muestra otro documento, devuelve la dirección de ese documento. */
function viewedDocument(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  for (const param of VIEWER_PARAMS) {
    const value = parsed.searchParams.get(param);
    if (!value) continue;
    try {
      const target = new URL(value, parsed).href;
      if (documentKind(target)) return target;
    } catch {
      // No es una dirección: se prueba el siguiente parámetro.
    }
  }
  return null;
}

function toCandidate(item: ScannedItem): DocumentCandidate | null {
  const target = documentKind(item.url) ? item.url : (viewedDocument(item.url) ?? item.url);
  const url = normalizeUrl(target);
  if (!url) return null;
  // Un PDF incrustado puede no tener extensión, pero sí `type="application/pdf"`.
  const kind =
    documentKind(url) ?? (item.embedded && item.type === 'application/pdf' ? 'pdf' : null);
  // De lo incrustado solo cuentan los PDF (RN-14).
  if (!kind || (item.embedded && kind !== 'pdf')) return null;
  return { url, fileName: fileNameFromUrl(url), kind };
}

/** Documentos de la página, cada uno una sola vez por dirección (RN-02), en orden de aparición. */
export function candidatesFromScan(items: ScannedItem[]): DocumentCandidate[] {
  const byUrl = new Map<string, DocumentCandidate>();
  for (const item of items) {
    const candidate = toCandidate(item);
    if (candidate && !byUrl.has(candidate.url)) byUrl.set(candidate.url, candidate);
  }
  return [...byUrl.values()];
}

/** El documento de un PDF abierto directamente en la pestaña (RF-04). */
export function candidateFromTab(url: string): DocumentCandidate | null {
  return toCandidate({ url, embedded: false, type: null });
}

/**
 * RN-03 a RN-05: dos documentos con dirección distinta son el mismo si tienen el mismo nombre de
 * fichero y el mismo tamaño. Sin tamaño conocido se consideran distintos. Se queda el primero.
 */
export function mergeBySize(
  candidates: DocumentCandidate[],
  sizes: ReadonlyMap<string, number>,
): DocumentCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const size = sizes.get(candidate.url);
    if (size === undefined) return true;
    const key = `${candidate.fileName}\u0000${size}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
