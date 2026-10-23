import {
  ADD_TO_NOTEBOOK,
  type AddToNotebookRequest,
  type AddToNotebookResponse,
  LAST_NOTEBOOK_KEY,
  type Notebook,
  type SourceTarget,
} from '@/utils/sources';
import type { StatusKind } from './main';
import { loadNotebooks } from './notebooks';

/** Acción "Añadir a cuaderno" en un vídeo o una lista de YouTube. */
export function setupAdd(
  target: SourceTarget,
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
    const notebook = notebooks.find((n) => n.id === select.value);
    if (!notebook) return;
    busy = true;
    updateButton();
    addButton.ariaBusy = 'true';
    showStatus(
      target.kind === 'video' ? 'Añadiendo el vídeo…' : 'Añadiendo los vídeos de la lista…',
      'info',
    );
    try {
      const request: AddToNotebookRequest = { type: ADD_TO_NOTEBOOK, notebook, target };
      const response: AddToNotebookResponse = await browser.runtime.sendMessage(request);
      if (response.addedAny) await browser.storage.local.set({ [LAST_NOTEBOOK_KEY]: notebook.id });
      showStatus(response.message, response.ok ? 'success' : 'error');
    } catch (error) {
      showStatus(error instanceof Error ? error.message : String(error));
    } finally {
      busy = false;
      updateButton();
      addButton.ariaBusy = null;
    }
  }

  select.addEventListener('change', updateButton);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void addToSelected();
  });

  void loadNotebooks(select, showStatus).then((loaded) => {
    notebooks = loaded;
    updateButton();
  });
}
