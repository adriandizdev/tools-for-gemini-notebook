/**
 * Lectura de los vídeos de una lista de reproducción de YouTube. Verificado el 2026-10-12:
 * la página trae los primeros 100 vídeos como `lockupViewModel` en `ytInitialData`, y el
 * resto se pide a `/youtubei/v1/browse` con el token de `continuationItemViewModel`.
 */

import { dig } from './dig';

const YOUTUBE_ORIGIN = 'https://www.youtube.com';
/** Tope de páginas de continuación (100 vídeos cada una) para no quedarse en un bucle. */
const MAX_CONTINUATIONS = 50;

export interface PlaylistPage {
  videoIds: string[];
  continuation: string | null;
}

export interface InnertubeClient {
  clientName: string;
  clientVersion: string;
}

export function parsePlaylistHtml(html: string): PlaylistPage & { client: InnertubeClient | null } {
  const data = extractJson(html, 'var ytInitialData = ');
  if (!data) throw new Error('No se ha podido leer la lista de reproducción');
  // Solo cuenta la primera sección: hay otra continuación a nivel de secciones que no son vídeos.
  const items = dig(
    data,
    'contents',
    'twoColumnBrowseResultsRenderer',
    'tabs',
    0,
    'tabRenderer',
    'content',
    'sectionListRenderer',
    'contents',
    0,
    'itemSectionRenderer',
    'contents',
  );
  return { ...parseItems(items), client: parseClient(html) };
}

/** Respuesta JSON de `/youtubei/v1/browse` a una continuación. */
export function parseContinuationResponse(json: unknown): PlaylistPage {
  const actions = dig(json, 'onResponseReceivedActions');
  const items = Array.isArray(actions)
    ? actions.flatMap((a) => {
        const continuationItems = dig(a, 'appendContinuationItemsAction', 'continuationItems');
        return Array.isArray(continuationItems) ? (continuationItems as unknown[]) : [];
      })
    : [];
  return parseItems(items);
}

function parseItems(items: unknown): PlaylistPage {
  const videoIds: string[] = [];
  let continuation: string | null = null;
  if (Array.isArray(items)) {
    for (const item of items as unknown[]) {
      const id = dig(item, 'lockupViewModel', 'contentId');
      if (typeof id === 'string' && /^[\w-]{11}$/.test(id)) videoIds.push(id);
      const token = dig(
        item,
        'continuationItemViewModel',
        'continuationCommand',
        'innertubeCommand',
        'continuationCommand',
        'token',
      );
      if (typeof token === 'string') continuation = token;
    }
  }
  return { videoIds, continuation };
}

function parseClient(html: string): InnertubeClient | null {
  const client = dig(extractJson(html, '"INNERTUBE_CONTEXT":'), 'client');
  const clientName = dig(client, 'clientName');
  const clientVersion = dig(client, 'clientVersion');
  return typeof clientName === 'string' && typeof clientVersion === 'string'
    ? { clientName, clientVersion }
    : null;
}

/** Extrae el objeto JSON que sigue a `marker`, respetando strings y escapes. */
function extractJson(html: string, marker: string): unknown {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const from = start + marker.length;
  let depth = 0;
  let inString = false;
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(from, i + 1));
  }
  return null;
}

/** Devuelve todos los ids de vídeo de la lista, en orden. */
export async function listPlaylistVideos(
  listId: string,
  fetchFn: typeof fetch = fetch,
): Promise<string[]> {
  const response = await fetchFn(`${YOUTUBE_ORIGIN}/playlist?list=${encodeURIComponent(listId)}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error(`YouTube no responde (HTTP ${response.status})`);
  const first = parsePlaylistHtml(await response.text());
  const videoIds = [...first.videoIds];
  let continuation = first.continuation;

  for (let page = 0; continuation && first.client && page < MAX_CONTINUATIONS; page++) {
    const next = await fetchFn(`${YOUTUBE_ORIGIN}/youtubei/v1/browse?prettyPrint=false`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: { client: { ...first.client, hl: 'es' } }, continuation }),
    });
    if (!next.ok) throw new Error(`YouTube no responde (HTTP ${next.status})`);
    const parsed = parseContinuationResponse(await next.json());
    videoIds.push(...parsed.videoIds);
    continuation = parsed.continuation;
  }
  return videoIds;
}
