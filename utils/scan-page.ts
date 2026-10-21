/** Lo que `scanPage` encuentra en la página, antes de filtrar con `utils/documents.ts`. */
export interface ScannedItem {
  /** Dirección absoluta. */
  url: string;
  /** `true` si está incrustado (`iframe`, `embed`, `object`); `false` si es un enlace. */
  embedded: boolean;
  /** Atributo `type`, si lo tiene (p. ej. `application/pdf`). */
  type: string | null;
}

/**
 * Se inyecta en la pestaña con `scripting.executeScript`, que serializa la función: tiene que
 * ser autocontenida (sin imports ni nada de fuera de su cuerpo).
 *
 * De los enlaces solo devuelve los que parecen un documento, para no mandar al popup miles de
 * enlaces; lo incrustado lo devuelve todo porque suele ser poco y puede no tener extensión.
 */
export function scanPage(): ScannedItem[] {
  const looksLikeDocument = /\.(pdf|docx|pptx)(?:$|[?#&/])/i;
  const items: ScannedItem[] = [];

  for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    if (looksLikeDocument.test(link.href)) {
      items.push({ url: link.href, embedded: false, type: link.getAttribute('type') });
    }
  }

  for (const el of Array.from(document.querySelectorAll<HTMLElement>('iframe[src], embed[src], object[data]'))) {
    const url =
      el instanceof HTMLObjectElement ? el.data : el instanceof HTMLIFrameElement || el instanceof HTMLEmbedElement ? el.src : '';
    if (url) items.push({ url, embedded: true, type: el.getAttribute('type') });
  }

  return items;
}
