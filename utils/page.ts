import { documentKind } from './documents';
import { NOTEBOOKLM_HOSTS, UNIR_VISOR_HOST, YOUTUBE_HOSTS } from './domains';
import { parseVisorPath } from './unir';

/** Qué acciones ofrece el panel según la página de la pestaña activa. */
export type PageKind =
  | { kind: 'video'; videoId: string }
  | { kind: 'playlist'; listId: string }
  | { kind: 'notebook' }
  /** Cualquier otra web: se buscan sus documentos (REQ-002, RF-01). */
  | { kind: 'web' }
  /** Un PDF abierto directamente en la pestaña (REQ-002, RF-04). */
  | { kind: 'document'; url: string }
  /** La página de una asignatura o de un tema del visor de UNIR (REQ-003, RF-01 y RF-02). */
  | { kind: 'unir'; subjectId: string; topicId?: string }
  | { kind: 'none' };

/**
 * Clasifica la URL de la pestaña activa. Con el permiso `activeTab`, `url` llega al abrir el
 * panel en cualquier web; llega `undefined` en las páginas internas del navegador.
 */
export function classifyTab(url: string | undefined): PageKind {
  if (!url) return { kind: 'none' };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: 'none' };
  }

  if (NOTEBOOKLM_HOSTS.includes(parsed.hostname)) {
    return parsed.pathname.startsWith('/notebook/') ? { kind: 'notebook' } : { kind: 'none' };
  }

  if (YOUTUBE_HOSTS.includes(parsed.hostname)) {
    // Un vídeo que se reproduce dentro de una lista cuenta como vídeo (RF-10).
    const videoId =
      parsed.pathname === '/watch' ? parsed.searchParams.get('v') : shortsId(parsed.pathname);
    if (videoId) return { kind: 'video', videoId };
    const listId = parsed.searchParams.get('list');
    if (parsed.pathname === '/playlist' && listId) return { kind: 'playlist', listId };
    // En YouTube no se buscan documentos (REQ-002, RF-20).
    return { kind: 'none' };
  }

  if (parsed.hostname === UNIR_VISOR_HOST) {
    // En el visor de UNIR el listado de temas sustituye a la búsqueda de documentos (REQ-003, RF-04).
    const visor = parseVisorPath(parsed.pathname);
    return visor ? { kind: 'unir', ...visor } : { kind: 'none' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { kind: 'none' };
  return documentKind(url) === 'pdf' ? { kind: 'document', url } : { kind: 'web' };
}

function shortsId(pathname: string): string | null {
  return /^\/shorts\/([\w-]+)/.exec(pathname)?.[1] ?? null;
}

export const youtubeVideoUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
