import {
  LAST_INCOGNITO_ACCOUNT_KEY,
  LEGACY_LAST_NOTEBOOK_KEY,
  setLastNotebook,
} from '@/utils/accounts';
import { type DocumentToAdd, addDocuments } from '@/utils/add-documents';
import { addToNotebook } from '@/utils/add-sources';
import { createDocumentBackend } from '@/utils/document-backend';
import { NO_NOTEBOOKS, NOT_LOGGED_IN } from '@/utils/strings';
import {
  type Account,
  NotLoggedInError,
  createNotebookLmClient,
  listAccounts,
} from '@/utils/notebooklm-api';
import { createSourceBackend } from '@/utils/source-backend';
import {
  ADD_DOCUMENTS_PORT,
  ADD_TO_NOTEBOOK,
  type AddDocumentsEvent,
  type AddDocumentsRequest,
  type AddToNotebookRequest,
  type AddToNotebookResponse,
  LIST_ACCOUNTS,
  LIST_NOTEBOOKS,
  type ListAccountsResponse,
  type ListNotebooksRequest,
  type ListNotebooksResponse,
} from '@/utils/protocol';
import { TOPIC_NOT_DELIVERED, VISOR_TAB_CLOSED, topicPdfPath, topicPdfUrl } from '@/utils/unir';
import { type VisorApiResult, callVisorApi } from '@/utils/injected/unir-page';
import { listPlaylistVideos } from '@/utils/youtube-playlist';

// Las llamadas a NotebookLM y YouTube se hacen aquí (con las host permissions y las cookies
// del usuario) y no en el popup, que se cierra en cuanto pierde el foco. Con `incognito: 'split'`,
// en incógnito corre otra instancia con las cookies de incógnito (REQ-004, RN-01).
export default defineBackground(() => {
  // Antes de REQ-004 se recordaba un solo cuaderno para todas las cuentas.
  browser.runtime.onInstalled.addListener(() => {
    void browser.storage.local.remove(LEGACY_LAST_NOTEBOOK_KEY).catch(() => {});
  });

  // SUP-03: la última cuenta de incógnito se olvida al cerrar todas las ventanas de incógnito.
  if (browser.extension.inIncognitoContext) {
    browser.windows.onRemoved.addListener(() => {
      void browser.windows
        .getAll()
        .then((windows) => {
          if (!windows.some((window) => window.incognito))
            return browser.storage.session.remove(LAST_INCOGNITO_ACCOUNT_KEY);
        })
        .catch(() => {});
    });
  }

  // `accounts`, `listNotebooks` y `add` no rechazan nunca: convierten cualquier error en una respuesta.
  browser.runtime.onMessage.addListener(
    (message: { type?: unknown } | undefined, _sender, sendResponse) => {
      if (message?.type === LIST_ACCOUNTS) {
        void accounts().then(sendResponse);
        return true;
      }
      if (message?.type === LIST_NOTEBOOKS) {
        void listNotebooks(message as ListNotebooksRequest).then(sendResponse);
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

/** Cada petición lleva su cuenta: se trabaja con ella aunque el popup cambie de cuenta (REQ-004, RN-05). */
const client = (account: Account) => createNotebookLmClient(fetch, account);

/** No rechaza nunca: cualquier error acaba en el evento `done`. */
async function addDocumentsFromPopup(
  { account, notebook, documents }: AddDocumentsRequest,
  post: (event: AddDocumentsEvent) => void,
) {
  let response: AddToNotebookResponse;
  try {
    const backend = createDocumentBackend(client(account), fetch, resolveDocumentUrl);
    response = await addDocuments(backend, notebook, documents, (url, status) =>
      post({ type: 'status', url, status }),
    );
  } catch (error) {
    response = { ok: false, addedAny: false, ...failure(error) };
  }
  // Se recuerda aquí y no en el popup, que puede haberse cerrado (RN-10, RN-16; REQ-004, RN-02).
  if (response.addedAny) await setLastNotebook(account.email, notebook.id).catch(() => {});
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

async function accounts(): Promise<ListAccountsResponse> {
  try {
    return { ok: true, accounts: await listAccounts() };
  } catch (error) {
    return { ok: false, ...failure(error) };
  }
}

async function listNotebooks({ account }: ListNotebooksRequest): Promise<ListNotebooksResponse> {
  try {
    const notebooks = await client(account).listNotebooks();
    if (!notebooks.length) return { ok: false, message: NO_NOTEBOOKS };
    return { ok: true, notebooks: notebooks.map(({ id, title }) => ({ id, title })) };
  } catch (error) {
    return { ok: false, ...failure(error) };
  }
}

async function add({
  account,
  notebook,
  target,
}: AddToNotebookRequest): Promise<AddToNotebookResponse> {
  try {
    const backend = createSourceBackend(client(account), (listId) => listPlaylistVideos(listId));
    return await addToNotebook(backend, notebook, target);
  } catch (error) {
    return { ok: false, addedAny: false, ...failure(error) };
  }
}

/** Sin sesión, M-19 y `loggedOut` para que el popup retire las acciones (REQ-004, RF-14, CB-08). */
function failure(error: unknown): { message: string; loggedOut?: boolean } {
  if (error instanceof NotLoggedInError) return { message: NOT_LOGGED_IN, loggedOut: true };
  return { message: error instanceof Error ? error.message : String(error) };
}
