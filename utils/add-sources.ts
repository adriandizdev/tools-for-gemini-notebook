import * as m from './messages';
import type { AddToNotebookResponse, Notebook, SourceTarget } from './sources';

/** Estado del cuaderno destino antes de añadir. `null` = Gemini Notebook no lo permite saber. */
export interface NotebookState {
  /** Ids de los vídeos de YouTube que ya son fuente (RN-07). */
  youtubeIds: Set<string> | null;
  /** Fuentes que aún admite el cuaderno (CB-01). */
  remaining: number | null;
}

type Rejected = { videoId: string; ok: false; reason: string };
export type AddResult = { videoId: string; ok: true } | Rejected;

const NO_RESPONSE = 'NotebookLM no ha respondido';
export const NOTEBOOK_FULL = 'el cuaderno ha alcanzado el límite de fuentes';

/** Lo que la orquestación necesita de NotebookLM y YouTube; en los tests se sustituye por un doble. */
export interface SourceBackend {
  getNotebookState(notebookId: string): Promise<NotebookState>;
  /** Devuelve un resultado por vídeo, en el mismo orden. */
  addYoutubeVideos(notebookId: string, videoIds: string[]): Promise<AddResult[]>;
  listPlaylistVideos(listId: string): Promise<string[]>;
}

export async function addToNotebook(
  backend: SourceBackend,
  notebook: Notebook,
  target: SourceTarget,
): Promise<AddToNotebookResponse> {
  return target.kind === 'video'
    ? addVideo(backend, notebook, target.videoId)
    : addPlaylist(backend, notebook, target.listId);
}

async function addVideo(backend: SourceBackend, notebook: Notebook, videoId: string) {
  const { youtubeIds, remaining } = await backend.getNotebookState(notebook.id);
  if (youtubeIds?.has(videoId)) {
    return { ok: true, addedAny: false, message: m.videoAlreadyPresent(notebook.title) };
  }
  // Un cuaderno lleno se trata como cualquier otro rechazo (RN-11).
  if (remaining === 0) {
    return { ok: false, addedAny: false, message: m.videoRejected(NOTEBOOK_FULL) };
  }
  const [result] = await addAll(backend, notebook.id, [videoId]);
  return result?.ok
    ? { ok: true, addedAny: true, message: m.videoAdded(notebook.title) }
    : { ok: false, addedAny: false, message: m.videoRejected(result?.reason ?? NO_RESPONSE) };
}

async function addPlaylist(backend: SourceBackend, notebook: Notebook, listId: string) {
  const videoIds = [...new Set(await backend.listPlaylistVideos(listId))];
  if (!videoIds.length) {
    return { ok: false, addedAny: false, message: m.playlistNoneAdded('la lista no tiene vídeos') };
  }

  const { youtubeIds, remaining } = await backend.getNotebookState(notebook.id);
  const pending = videoIds.filter((id) => !youtubeIds?.has(id));
  const present = videoIds.length - pending.length;

  // La lista se añade completa o no se añade (RN-03); solo cuentan los vídeos nuevos (RN-12).
  if (remaining !== null && pending.length > remaining) {
    return {
      ok: false,
      addedAny: false,
      message: m.playlistNoRoom(pending.length, notebook.title, remaining),
    };
  }

  const results = await addAll(backend, notebook.id, pending);
  const added = results.filter((r) => r.ok).length;
  const rejected = results.filter((r): r is Rejected => !r.ok);

  if (pending.length && !added) {
    return {
      ok: false,
      addedAny: false,
      message: m.playlistNoneAdded(rejected[0]?.reason ?? NO_RESPONSE),
    };
  }
  if (!present && !rejected.length) {
    return { ok: true, addedAny: true, message: m.playlistAdded(added, notebook.title) };
  }
  return {
    ok: true,
    addedAny: added > 0,
    message: m.playlistPartial(added, videoIds.length, notebook.title, present, rejected.length),
  };
}

/** Añade los vídeos; si la llamada entera falla, todos cuentan como rechazados con ese motivo. */
async function addAll(backend: SourceBackend, notebookId: string, videoIds: string[]) {
  if (!videoIds.length) return [];
  try {
    return await backend.addYoutubeVideos(notebookId, videoIds);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return videoIds.map((videoId): AddResult => ({ videoId, ok: false, reason }));
  }
}
