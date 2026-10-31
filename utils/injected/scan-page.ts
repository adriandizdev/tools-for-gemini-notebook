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
 * De los enlaces y las peticiones solo devuelve los que parecen un documento, para no mandar al
 * popup miles de direcciones; lo incrustado lo devuelve todo porque suele ser poco y puede no
 * tener extensión.
 */
export function scanPage(): ScannedItem[] {
  const looksLikeDocument = /\.(pdf|docx|pptx)(?:$|[?#&/])/i;
  // La URL de la pestaña va primero: puede traer el documento y su título, y el primero se queda.
  const items: ScannedItem[] = [{ url: location.href, embedded: false, type: null }];

  for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    if (looksLikeDocument.test(link.href)) {
      items.push({ url: link.href, embedded: false, type: link.getAttribute('type') });
    }
  }

  for (const el of Array.from(
    document.querySelectorAll<HTMLElement>('iframe[src], embed[src], object[data]'),
  )) {
    const url =
      el instanceof HTMLObjectElement
        ? el.data
        : el instanceof HTMLIFrameElement || el instanceof HTMLEmbedElement
          ? el.src
          : '';
    if (url) items.push({ url, embedded: true, type: el.getAttribute('type') });
  }

  // Los visores que dibujan en canvas no dejan el documento en el DOM, pero
  // sí su petición. Cuenta como incrustado: de lo que se muestra dentro solo valen los PDF.
  for (const entry of performance.getEntriesByType('resource')) {
    if (looksLikeDocument.test(entry.name)) {
      items.push({ url: entry.name, embedded: true, type: null });
    }
  }

  return items;
}
