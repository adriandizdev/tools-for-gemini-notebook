import type { AddResult, NotebookState, SourceBackend } from './add-sources';
import { type NotebookLmClient, RpcError } from './notebooklm-api';
import { youtubeVideoUrl } from './page';

/** NotebookLM no explica por qué rechaza un vídeo; su interfaz dice que no hay transcripción. */
export const REJECTED_REASON = 'Gemini Notebook no puede importarlo (no es público o no tiene transcripción)';

/** Une el cliente de NotebookLM y la lectura de listas de YouTube en lo que necesita `addToNotebook`. */
export function createSourceBackend(
  client: NotebookLmClient,
  listPlaylistVideos: (listId: string) => Promise<string[]>,
): SourceBackend {
  async function getNotebook(notebookId: string) {
    const notebook = (await client.listNotebooks()).find((n) => n.id === notebookId);
    if (!notebook) throw new Error('El cuaderno ya no existe en Gemini Notebook');
    return notebook;
  }

  return {
    listPlaylistVideos,

    async getNotebookState(notebookId): Promise<NotebookState> {
      const notebook = await getNotebook(notebookId);
      return {
        // Las fuentes con error no cuentan como "ya presentes": el vídeo no está realmente.
        youtubeIds: new Set(notebook.sources.flatMap((s) => (s.ready && s.youtubeId ? [s.youtubeId] : []))),
        // Las fuentes con error sí ocupan sitio.
        remaining: notebook.maxSources === null ? null : Math.max(0, notebook.maxSources - notebook.sources.length),
      };
    },

    async addYoutubeVideos(notebookId, videoIds): Promise<AddResult[]> {
      const before = new Set((await getNotebook(notebookId)).sources.map((s) => s.id));

      let accepted: Awaited<ReturnType<NotebookLmClient['addUrls']>> = [];
      try {
        accepted = await client.addUrls(notebookId, videoIds.map(youtubeVideoUrl));
      } catch (error) {
        // Si rechaza todos los vídeos, NotebookLM responde con error en vez de una lista vacía.
        if (!(error instanceof RpcError)) throw error;
      }

      // NotebookLM deja los vídeos rechazados como fuentes con error: se borran para no dejar
      // el cuaderno a medias.
      const acceptedIds = new Set(accepted.map((s) => s.id));
      const leftovers = (await getNotebook(notebookId)).sources
        .filter((s) => !s.ready && !before.has(s.id) && !acceptedIds.has(s.id))
        .map((s) => s.id);
      try {
        await client.deleteSources(notebookId, leftovers);
      } catch (error) {
        console.warn('No se han podido borrar las fuentes con error', error);
      }

      const added = new Set(accepted.map((s) => s.youtubeId));
      return videoIds.map((videoId) =>
        added.has(videoId) ? { videoId, ok: true } : { videoId, ok: false, reason: REJECTED_REASON },
      );
    },
  };
}
