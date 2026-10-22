import type { DocumentBackend, DocumentNotebookState, DocumentToAdd } from './add-documents';
import { EXTENSION_BY_KIND } from './documents';
import type { NotebookLmClient } from './notebooklm-api';

/** Motivos que se muestran en M-17 cuando no se puede descargar el documento (CB-03). */
export const DOWNLOAD_FAILED = 'no se ha podido descargar de la web';
export const ACCESS_DENIED = 'la web exige iniciar sesión o deniega el acceso';
export const NOT_FOUND = 'el documento ya no existe en la web';
export const NOT_A_DOCUMENT = 'la web no ha devuelto el documento, sino una página';

/**
 * Une el cliente de NotebookLM y la descarga desde la web en lo que necesita `addDocuments`.
 * `resolveUrl` da la dirección de la que se descarga cada documento: la suya, salvo en los temas de
 * UNIR, cuyo PDF hay que pedírselo antes al visor (REQ-003). Si falla, lanza el motivo de M-17.
 */
export function createDocumentBackend(
  client: NotebookLmClient,
  fetchFn: typeof fetch = fetch,
  resolveUrl: (document: DocumentToAdd) => Promise<string> = (document) =>
    Promise.resolve(document.url),
): DocumentBackend {
  async function getNotebook(notebookId: string) {
    const notebook = (await client.listNotebooks()).find((n) => n.id === notebookId);
    if (!notebook) throw new Error('El cuaderno ya no existe en Gemini Notebook');
    return notebook;
  }

  return {
    async getNotebookState(notebookId): Promise<DocumentNotebookState> {
      const notebook = await getNotebook(notebookId);
      return {
        titles: new Set(notebook.sources.map((s) => s.title)),
        remaining:
          notebook.maxSources === null
            ? null
            : Math.max(0, notebook.maxSources - notebook.sources.length),
      };
    },

    async addDocument(notebookId, document) {
      const content = await download(await resolveUrl(document), fetchFn);

      // Gemini Notebook exige la extensión en el nombre del fichero; después se renombra la
      // fuente para que quede con el nombre del listado (RF-15).
      const fileName = `${document.name}.${EXTENSION_BY_KIND[document.kind]}`;
      const sourceId = await client.registerFile(notebookId, fileName);
      try {
        await client.uploadFile(notebookId, sourceId, fileName, content);
      } catch (error) {
        // Sin contenido, la fuente se queda colgada en el cuaderno: se borra.
        await client.deleteSources(notebookId, [sourceId]).catch((deleteError: unknown) => {
          console.warn('No se ha podido borrar la fuente sin contenido', deleteError);
        });
        throw error;
      }
      try {
        await client.renameSource(notebookId, sourceId, document.name);
      } catch (error) {
        // El documento ya está añadido; solo conserva la extensión en el título.
        console.warn('No se ha podido quitar la extensión del nombre de la fuente', error);
      }
    },
  };
}

/**
 * Descarga sin las cookies del usuario: los documentos que exigen sesión en la web quedan fuera
 * de esta iteración y fallan con su motivo (REQ-002, *Fuera de Alcance*).
 */
async function download(url: string, fetchFn: typeof fetch): Promise<Blob> {
  let response: Response;
  try {
    response = await fetchFn(url, { credentials: 'omit' });
  } catch {
    throw new Error(DOWNLOAD_FAILED);
  }
  if (response.status === 401 || response.status === 403) throw new Error(ACCESS_DENIED);
  if (response.status === 404 || response.status === 410) throw new Error(NOT_FOUND);
  if (!response.ok) throw new Error(`${DOWNLOAD_FAILED} (HTTP ${response.status})`);
  // Muchas webs responden a un documento privado con su página de inicio de sesión.
  if (response.headers.get('content-type')?.startsWith('text/html'))
    throw new Error(NOT_A_DOCUMENT);
  return response.blob();
}
