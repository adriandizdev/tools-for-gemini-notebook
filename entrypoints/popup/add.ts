import { setLastNotebook } from '@/utils/accounts';
import {
  ADD_TO_NOTEBOOK,
  type AddToNotebookRequest,
  type AddToNotebookResponse,
  type Notebook,
  type SourceTarget,
} from '@/utils/protocol';
import type { AccountSession } from './accounts';
import type { StatusKind } from './main';
import { loadNotebooks } from './notebooks';

/** Acción "Añadir a cuaderno" en un vídeo o una lista de YouTube, con la cuenta activa (REQ-004). */
export function setupAdd(
  target: SourceTarget,
  accounts: AccountSession,
  showStatus: (message: string, kind?: StatusKind) => void,
) {
  const form = document.querySelector<HTMLFormElement>('#notebook-form')!;
  const select = document.querySelector<HTMLSelectElement>('#notebook')!;
  const addButton = document.querySelector<HTMLButtonElement>('#add')!;
  let notebooks: Notebook[] = [];
  let busy = false;

  function updateButton() {
    addButton.disabled = busy || !select.value;
  }

  async function addToSelected() {
    const account = accounts.current;
    const notebook = notebooks.find((n) => n.id === select.value);
    if (!account || !notebook) return;
    busy = true;
    accounts.setBusy(true);
    updateButton();
    addButton.ariaBusy = 'true';
    showStatus(
      target.kind === 'video' ? 'Añadiendo el vídeo…' : 'Añadiendo los vídeos de la lista…',
      'info',
    );
    let loggedOut = false;
    try {
      const request: AddToNotebookRequest = { type: ADD_TO_NOTEBOOK, account, notebook, target };
      const response: AddToNotebookResponse = await browser.runtime.sendMessage(request);
      if (response.addedAny) await setLastNotebook(account.email, notebook.id).catch(() => {});
      loggedOut = Boolean(response.loggedOut);
      showStatus(response.message, response.ok ? 'success' : 'error');
    } catch (error) {
      showStatus(error instanceof Error ? error.message : String(error));
    } finally {
      busy = false;
      accounts.setBusy(false);
      updateButton();
      addButton.ariaBusy = null;
    }
    // REQ-004, CB-08: la sesión se cerró sin que el panel lo supiera.
    if (loggedOut) accounts.signedOut();
  }

  select.addEventListener('change', updateButton);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void addToSelected();
  });

  accounts.watch((account) => {
    notebooks = [];
    updateButton();
    void loadNotebooks(select, accounts, account, showStatus).then((loaded) => {
      if (!loaded) return;
      notebooks = loaded;
      updateButton();
    });
  });
}
