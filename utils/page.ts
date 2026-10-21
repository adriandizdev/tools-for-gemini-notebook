import { NOTEBOOKLM_HOSTS, YOUTUBE_HOSTS } from './domains';

/** Qué acciones ofrece el panel según la página de la pestaña activa. */
export type PageKind =
  | { kind: 'video'; videoId: string }
  | { kind: 'playlist'; listId: string }
  | { kind: 'notebook' }
  | { kind: 'none' };

/**
 * Clasifica la URL de la pestaña activa. `url` llega `undefined` en las webs sin
 * host permission, que no tienen acciones.
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
    const videoId = parsed.pathname === '/watch' ? parsed.searchParams.get('v') : shortsId(parsed.pathname);
    if (videoId) return { kind: 'video', videoId };
    const listId = parsed.searchParams.get('list');
    if (parsed.pathname === '/playlist' && listId) return { kind: 'playlist', listId };
  }

  return { kind: 'none' };
}

function shortsId(pathname: string): string | null {
  return /^\/shorts\/([\w-]+)/.exec(pathname)?.[1] ?? null;
}

export const youtubeVideoUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
