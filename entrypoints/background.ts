import { type DocumentToAdd, addDocuments } from '@/utils/add-documents';
import { addToNotebook } from '@/utils/add-sources';
import { createDocumentBackend } from '@/utils/document-backend';
import { NO_NOTEBOOKS, NOT_LOGGED_IN } from '@/utils/messages';
import { NotLoggedInError, createNotebookLmClient } from '@/utils/notebooklm-api';
import { createSourceBackend } from '@/utils/source-backend';
import {
  ADD_DOCUMENTS_PORT,
  ADD_TO_NOTEBOOK,
  type AddDocumentsEvent,
  type AddDocumentsRequest,
  type AddToNotebookRequest,
  type AddToNotebookResponse,
  LAST_NOTEBOOK_KEY,
  LIST_NOTEBOOKS,
  type ListNotebooksResponse,
} from '@/utils/sources';
import { TOPIC_NOT_DELIVERED, VISOR_TAB_CLOSED, topicPdfPath, topicPdfUrl } from '@/utils/unir';
import { type VisorApiResult, callVisorApi } from '@/utils/unir-page';
import { listPlaylistVideos } from '@/utils/youtube-playlist';

// Las llamadas a NotebookLM y YouTube se hacen aquí (con las host permissions y las cookies
// del usuario) y no en el popup, que se cierra en cuanto pierde el foco.
export default defineBackground(() => {
  // `listNotebooks` y `add` no rechazan nunca: convierten cualquier error en una respuesta.
  browser.runtime.onMessage.addListener(
    (message: { type?: unknown } | undefined, _sender, sendResponse) => {
      if (message?.type === LIST_NOTEBOOKS) {
        void listNotebooks().then(sendResponse);
        return true;
      }
      if (message?.type === ADD_TO_NOTEBOOK) {
        void add(message as AddToNotebookRequest).then(sendResponse);
        return true;
      }
    },
  );

  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== ADD_DOCUMENTS_PORT) return;
    let connected = true;
    port.onDisconnect.addListener(() => {
      connected = false;
    });
    // Si el popup se cierra, se dejan de enviar estados pero se termina de añadir (RN-16).
    const post = (event: AddDocumentsEvent) => {
      if (connected) port.postMessage(event);
    };
    port.onMessage.addListener((request: AddDocumentsRequest) => {
      void addDocumentsFromPopup(request, post);
    });
  });
});

/** No rechaza nunca: cualquier error acaba en el evento `done`. */
async function addDocumentsFromPopup(
  { notebook, documents }: AddDocumentsRequest,
  post: (event: AddDocumentsEvent) => void,
) {
  let response: AddToNotebookResponse;
  try {
    const backend = createDocumentBackend(createNotebookLmClient(), fetch, resolveDocumentUrl);
    response = await addDocuments(backend, notebook, documents, (url, status) =>
      post({ type: 'status', url, status }),
    );
  } catch (error) {
    response = { ok: false, addedAny: false, message: errorMessage(error) };
  }
  // Se recuerda aquí y no en el popup, que puede haberse cerrado (RN-10, RN-16).
  if (response.addedAny)
    await browser.storage.local.set({ [LAST_NOTEBOOK_KEY]: notebook.id }).catch(() => {});
  post({ type: 'done', response });
}

/** Los temas de UNIR se piden al visor desde su pestaña, con el token de la página (REQ-003, SUP-07). */
async function resolveDocumentUrl(document: DocumentToAdd): Promise<string> {
  if (!document.unirTopic) return document.url;
  const { tabId, topicId } = document.unirTopic;
  let result: VisorApiResult | undefined;
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: callVisorApi,
      args: ['POST', topicPdfPath(topicId)],
    });
    result = injection?.result;
  } catch {
    throw new Error(VISOR_TAB_CLOSED);
  }
  if (!result) throw new Error(TOPIC_NOT_DELIVERED);
  return topicPdfUrl(result);
}

async function listNotebooks(): Promise<ListNotebooksResponse> {
  try {
    const notebooks = await createNotebookLmClient().listNotebooks();
    if (!notebooks.length) return { ok: false, message: NO_NOTEBOOKS };
    return { ok: true, notebooks: notebooks.map(({ id, title }) => ({ id, title })) };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

async function add({ notebook, target }: AddToNotebookRequest): Promise<AddToNotebookResponse> {
  try {
    const backend = createSourceBackend(createNotebookLmClient(), (listId) =>
      listPlaylistVideos(listId),
    );
    return await addToNotebook(backend, notebook, target);
  } catch (error) {
    return { ok: false, addedAny: false, message: errorMessage(error) };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof NotLoggedInError) return NOT_LOGGED_IN;
  return error instanceof Error ? error.message : String(error);
}
