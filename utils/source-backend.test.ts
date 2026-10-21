import { describe, expect, it } from 'vitest';
import { type NotebookInfo, type NotebookLmClient, RpcError, type Source } from './notebooklm-api';
import { REJECTED_REASON, createSourceBackend } from './source-backend';

const ready = (id: string, youtubeId: string): Source => ({ id, title: youtubeId, youtubeId, ready: true });
const failed = (id: string): Source => ({ id, title: id, youtubeId: null, ready: false });
const notUsed = () => Promise.reject(new Error('no se usa en estos tests'));

/** Doble de NotebookLM que, como el real, deja los vídeos rechazados como fuentes con error. */
function fakeClient(
  initial: Source[],
  { valid = [], maxSources = 300 }: { valid?: string[]; maxSources?: number | null } = {},
) {
  let sources = [...initial];
  const deleted: string[] = [];
  let next = 0;
  const client: NotebookLmClient = {
    async listNotebooks(): Promise<NotebookInfo[]> {
      return [{ id: 'nb', title: 'Prueba', sources: [...sources], maxSources }];
    },
    async addUrls(_id, urls) {
      const accepted: Source[] = [];
      for (const url of urls) {
        const videoId = new URL(url).searchParams.get('v')!;
        const ok = valid.includes(videoId);
        const source = { id: `s${next++}`, title: url, youtubeId: ok ? videoId : null, ready: ok };
        sources.push(source);
        if (ok) accepted.push(source);
      }
      if (!accepted.length) throw new RpcError('izAoDd', [9]);
      return accepted;
    },
    async deleteSources(_id, ids) {
      deleted.push(...ids);
      sources = sources.filter((s) => !ids.includes(s.id));
    },
    registerFile: notUsed,
    uploadFile: notUsed,
    renameSource: notUsed,
  };
  return { client, deleted, sources: () => sources };
}

const noPlaylist = async () => [];

describe('createSourceBackend', () => {
  it('calcula los vídeos presentes y el cupo restante', async () => {
    const { client } = fakeClient([ready('a', 'v1'), failed('b')], {
      maxSources: 50,
    });
    const state = await createSourceBackend(client, noPlaylist).getNotebookState('nb');
    expect([...state.youtubeIds!]).toEqual(['v1']);
    expect(state.remaining).toBe(48);
  });

  it('no conoce el cupo si NotebookLM no lo envía', async () => {
    const { client } = fakeClient([], { maxSources: null });
    expect((await createSourceBackend(client, noPlaylist).getNotebookState('nb')).remaining).toBeNull();
  });

  it('falla si el cuaderno ya no existe', async () => {
    const { client } = fakeClient([]);
    await expect(createSourceBackend(client, noPlaylist).getNotebookState('otro')).rejects.toThrow('ya no existe');
  });

  it('borra las fuentes con error que deja un alta mixta y no toca las anteriores', async () => {
    const previous = failed('old');
    const { client, deleted, sources } = fakeClient([previous], { valid: ['ok1', 'ok2'] });
    const results = await createSourceBackend(client, noPlaylist).addYoutubeVideos('nb', ['ok1', 'bad', 'ok2']);
    expect(results).toEqual([
      { videoId: 'ok1', ok: true },
      { videoId: 'bad', ok: false, reason: REJECTED_REASON },
      { videoId: 'ok2', ok: true },
    ]);
    expect(deleted).toEqual(['s1']);
    expect(sources().map((s) => s.youtubeId ?? s.id)).toEqual(['old', 'ok1', 'ok2']);
  });

  it('si NotebookLM rechaza todos, los marca como rechazados y deja el cuaderno como estaba', async () => {
    const { client, sources } = fakeClient([ready('a', 'v1')]);
    const results = await createSourceBackend(client, noPlaylist).addYoutubeVideos('nb', ['bad1', 'bad2']);
    expect(results.every((r) => !r.ok)).toBe(true);
    expect(sources()).toEqual([ready('a', 'v1')]);
  });
});
