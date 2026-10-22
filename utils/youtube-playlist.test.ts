import { describe, expect, it } from 'vitest';
import {
  listPlaylistVideos,
  parseContinuationResponse,
  parsePlaylistHtml,
} from './youtube-playlist';
import playlist from './__fixtures__/youtube-playlist.html?raw';
import playlistContinuation from './__fixtures__/youtube-playlist-continuation.json?raw';
import playlistLong from './__fixtures__/youtube-playlist-long.html?raw';

const fixtures: Record<string, string> = {
  'youtube-playlist.html': playlist,
  'youtube-playlist-long.html': playlistLong,
  'youtube-playlist-continuation.json': playlistContinuation,
};
const fixture = (name: string) => fixtures[name]!;

describe('parsePlaylistHtml', () => {
  it('lee los vídeos de una lista corta e ignora la continuación de secciones', () => {
    const page = parsePlaylistHtml(fixture('youtube-playlist.html'));
    expect(page.videoIds).toHaveLength(10);
    expect(page.videoIds.slice(0, 3)).toEqual(['aircAruvnKk', 'IHZwWFHWa-w', 'Ilg3gGewQ5U']);
    expect(page.continuation).toBeNull();
    expect(page.client?.clientName).toBe('WEB');
    expect(page.client?.clientVersion).toMatch(/^2\./);
  });

  it('devuelve el token de continuación de una lista larga', () => {
    const page = parsePlaylistHtml(fixture('youtube-playlist-long.html'));
    expect(page.videoIds).toHaveLength(3);
    expect(page.continuation).toMatch(/^4qmF/);
  });

  it('falla si la página no es una lista', () => {
    expect(() => parsePlaylistHtml('<html></html>')).toThrow(
      'No se ha podido leer la lista de reproducción',
    );
  });
});

describe('parseContinuationResponse', () => {
  it('lee los vídeos de la siguiente página', () => {
    const page = parseContinuationResponse(
      JSON.parse(fixture('youtube-playlist-continuation.json')),
    );
    expect(page.videoIds).toHaveLength(2);
    expect(page.continuation).toBeNull();
  });
});

describe('listPlaylistVideos', () => {
  it('sigue las continuaciones hasta el final', async () => {
    const requests: { url: string; body?: string }[] = [];
    const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: input instanceof Request ? input.url : String(input),
        body: init?.body as string | undefined,
      });
      return new Response(
        requests.length === 1
          ? fixture('youtube-playlist-long.html')
          : fixture('youtube-playlist-continuation.json'),
      );
    }) as typeof fetch;

    expect(await listPlaylistVideos('UU123', fetchFn)).toHaveLength(5);
    expect(requests[0]!.url).toBe('https://www.youtube.com/playlist?list=UU123');
    expect(requests[1]!.url).toContain('/youtubei/v1/browse');
    expect((JSON.parse(requests[1]!.body!) as { continuation: string }).continuation).toMatch(
      /^4qmF/,
    );
  });
});
