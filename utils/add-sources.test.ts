import { describe, expect, it } from 'vitest';
import {
  type AddResult,
  NOTEBOOK_FULL,
  type NotebookState,
  type SourceBackend,
  addToNotebook,
} from './add-sources';
import * as m from './strings';
import { NotLoggedInError } from './notebooklm-api';

const notebook = { id: 'nb1', title: 'Física' };

/** Doble de NotebookLM + YouTube: guarda las fuentes añadidas y rechaza los vídeos de `rejected`. */
function fakeBackend({
  existing = [],
  remaining = null,
  playlist = [],
  rejected = {},
  failWith,
}: {
  existing?: string[] | null;
  remaining?: number | null;
  playlist?: string[];
  rejected?: Record<string, string>;
  failWith?: string;
} = {}) {
  const added: string[] = [];
  const backend: SourceBackend = {
    async getNotebookState(): Promise<NotebookState> {
      return { youtubeIds: existing && new Set(existing), remaining };
    },
    async addYoutubeVideos(_id, videoIds): Promise<AddResult[]> {
      if (failWith) throw new Error(failWith);
      return videoIds.map((videoId) => {
        if (rejected[videoId]) return { videoId, ok: false, reason: rejected[videoId] };
        added.push(videoId);
        return { videoId, ok: true };
      });
    },
    async listPlaylistVideos() {
      return playlist;
    },
  };
  return { backend, added };
}

const video = (videoId: string) => ({ kind: 'video', videoId }) as const;
const list = { kind: 'playlist', listId: 'PL1' } as const;

describe('añadir un vídeo', () => {
  it('CA-01: añade el vídeo y muestra M-01', async () => {
    const { backend, added } = fakeBackend();
    expect(await addToNotebook(backend, notebook, video('a'))).toEqual({
      ok: true,
      addedAny: true,
      message: m.videoAdded('Física'),
    });
    expect(added).toEqual(['a']);
  });

  it('CA-08: no añade un vídeo que ya es fuente y muestra M-04', async () => {
    const { backend, added } = fakeBackend({ existing: ['a'] });
    const result = await addToNotebook(backend, notebook, video('a'));
    expect(result.message).toBe(m.videoAlreadyPresent('Física'));
    expect(result.addedAny).toBe(false);
    expect(added).toEqual([]);
  });

  it('CA-19: sin poder consultar las fuentes, añade sin comprobar', async () => {
    const { backend, added } = fakeBackend({ existing: null });
    expect((await addToNotebook(backend, notebook, video('a'))).message).toBe(
      m.videoAdded('Física'),
    );
    expect(added).toEqual(['a']);
  });

  it('CA-09: muestra M-06 con el motivo si NotebookLM lo rechaza', async () => {
    const { backend } = fakeBackend({ rejected: { a: 'el vídeo es privado' } });
    expect(await addToNotebook(backend, notebook, video('a'))).toEqual({
      ok: false,
      addedAny: false,
      message: m.videoRejected('el vídeo es privado'),
    });
  });

  it('CA-17: un cuaderno lleno es un rechazo más (M-06) y no se intenta añadir', async () => {
    const { backend, added } = fakeBackend({ remaining: 0 });
    expect((await addToNotebook(backend, notebook, video('a'))).message).toBe(
      m.videoRejected(NOTEBOOK_FULL),
    );
    expect(added).toEqual([]);
  });

  it('CA-17: si no se conoce el cupo, el rechazo de NotebookLM se muestra con M-06', async () => {
    const { backend } = fakeBackend({ failWith: 'límite de fuentes alcanzado' });
    expect((await addToNotebook(backend, notebook, video('a'))).message).toBe(
      m.videoRejected('límite de fuentes alcanzado'),
    );
  });
});

describe('añadir una lista', () => {
  it('CA-02: añade todos los vídeos como fuentes independientes y muestra M-02', async () => {
    const { backend, added } = fakeBackend({ playlist: ['a', 'b', 'c'], remaining: 3 });
    expect(await addToNotebook(backend, notebook, list)).toEqual({
      ok: true,
      addedAny: true,
      message: m.playlistAdded(3, 'Física'),
    });
    expect(added).toEqual(['a', 'b', 'c']);
  });

  it('CA-07: si no cabe entera, no añade nada y muestra M-05', async () => {
    const { backend, added } = fakeBackend({ playlist: ['a', 'b', 'c'], remaining: 2 });
    const result = await addToNotebook(backend, notebook, list);
    expect(result.message).toBe(m.playlistNoRoom(3, 'Física', 2));
    expect(result.addedAny).toBe(false);
    expect(added).toEqual([]);
  });

  it('CA-12: añade solo los que faltan y muestra M-03', async () => {
    const { backend, added } = fakeBackend({
      playlist: ['a', 'b', 'c', 'd', 'e'],
      existing: ['a', 'c', 'e'],
    });
    expect((await addToNotebook(backend, notebook, list)).message).toBe(
      m.playlistPartial(2, 5, 'Física', 3, 0),
    );
    expect(added).toEqual(['b', 'd']);
  });

  it('CA-18: para el cupo solo cuentan los vídeos nuevos', async () => {
    const { backend, added } = fakeBackend({
      playlist: ['a', 'b', 'c', 'd'],
      existing: ['a', 'b'],
      remaining: 2,
    });
    expect((await addToNotebook(backend, notebook, list)).message).toBe(
      m.playlistPartial(2, 4, 'Física', 2, 0),
    );
    expect(added).toEqual(['c', 'd']);
  });

  it('CA-13: omite los vídeos no admitidos, añade el resto y muestra M-03', async () => {
    const { backend, added } = fakeBackend({
      playlist: ['a', 'b', 'p', 'c', 'd'],
      rejected: { p: 'el vídeo es privado' },
    });
    expect((await addToNotebook(backend, notebook, list)).message).toBe(
      m.playlistPartial(4, 5, 'Física', 0, 1),
    );
    expect(added).toEqual(['a', 'b', 'c', 'd']);
  });

  it('CA-14: si no se añade ninguno, muestra M-07 con el motivo', async () => {
    const { backend } = fakeBackend({
      playlist: ['p', 'q'],
      rejected: { p: 'el vídeo es privado', q: 'el vídeo es privado' },
    });
    expect(await addToNotebook(backend, notebook, list)).toEqual({
      ok: false,
      addedAny: false,
      message: m.playlistNoneAdded('el vídeo es privado'),
    });
  });

  it('si la llamada entera falla, ningún vídeo cuenta como añadido (M-07)', async () => {
    const { backend } = fakeBackend({
      playlist: ['a', 'b'],
      failWith: 'límite de fuentes alcanzado',
    });
    expect((await addToNotebook(backend, notebook, list)).message).toBe(
      m.playlistNoneAdded('límite de fuentes alcanzado'),
    );
  });

  it('si todos los vídeos ya están, no añade nada y lo resume con M-03', async () => {
    const { backend, added } = fakeBackend({ playlist: ['a', 'b'], existing: ['a', 'b'] });
    const result = await addToNotebook(backend, notebook, list);
    expect(result.message).toBe(m.playlistPartial(0, 2, 'Física', 2, 0));
    expect(result.addedAny).toBe(false);
    expect(added).toEqual([]);
  });

  it('cuenta una sola vez los vídeos repetidos en la lista', async () => {
    const { backend, added } = fakeBackend({ playlist: ['a', 'b', 'a'] });
    expect((await addToNotebook(backend, notebook, list)).message).toBe(
      m.playlistAdded(2, 'Física'),
    );
    expect(added).toEqual(['a', 'b']);
  });
});

describe('sesión cerrada (REQ-004)', () => {
  it('CB-08: si Gemini Notebook rechaza el vídeo por falta de sesión, el error sube (M-19)', async () => {
    const { backend } = fakeBackend();
    backend.addYoutubeVideos = () => Promise.reject(new NotLoggedInError());
    await expect(addToNotebook(backend, notebook, video('a'))).rejects.toBeInstanceOf(
      NotLoggedInError,
    );
  });
});
