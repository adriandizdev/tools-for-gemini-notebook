import { addToNotebook } from '@/utils/add-sources';
import { NO_NOTEBOOKS, NOT_LOGGED_IN } from '@/utils/messages';
import { NotLoggedInError, createNotebookLmClient } from '@/utils/notebooklm-api';
import { createSourceBackend } from '@/utils/source-backend';
import {
  ADD_TO_NOTEBOOK,
  type AddToNotebookRequest,
  type AddToNotebookResponse,
  LIST_NOTEBOOKS,
  type ListNotebooksResponse,
} from '@/utils/sources';
import { listPlaylistVideos } from '@/utils/youtube-playlist';

// Las llamadas a NotebookLM y YouTube se hacen aquí (con las host permissions y las cookies
// del usuario) y no en el popup, que se cierra en cuanto pierde el foco.
export default defineBackground(() => {
  // `listNotebooks` y `add` no rechazan nunca: convierten cualquier error en una respuesta.
  browser.runtime.onMessage.addListener((message: { type?: unknown } | undefined, _sender, sendResponse) => {
    if (message?.type === LIST_NOTEBOOKS) {
      void listNotebooks().then(sendResponse);
      return true;
    }
    if (message?.type === ADD_TO_NOTEBOOK) {
      void add(message as AddToNotebookRequest).then(sendResponse);
      return true;
    }
  });
});

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
    const backend = createSourceBackend(createNotebookLmClient(), (listId) => listPlaylistVideos(listId));
    return await addToNotebook(backend, notebook, target);
  } catch (error) {
    return { ok: false, addedAny: false, message: errorMessage(error) };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof NotLoggedInError) return NOT_LOGGED_IN;
  return error instanceof Error ? error.message : String(error);
}
