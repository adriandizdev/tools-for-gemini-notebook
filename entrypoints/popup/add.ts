import {
  ADD_TO_NOTEBOOK,
  type AddToNotebookRequest,
  type AddToNotebookResponse,
  LAST_NOTEBOOK_KEY,
  LIST_NOTEBOOKS,
  type ListNotebooksResponse,
  type Notebook,
  type SourceTarget,
} from '@/utils/sources';
import { NO_NOTEBOOKS } from '@/utils/messages';
import type { StatusKind } from './main';

/** Acción "Añadir a cuaderno" en un vídeo o una lista de YouTube. */
export function setupAdd(target: SourceTarget, showStatus: (message: string, kind?: StatusKind) => void) {
  const addButton = document.querySelector<HTMLButtonElement>('#add')!;
  const form = document.querySelector<HTMLFormElement>('#notebook-form')!;
  const select = document.querySelector<HTMLSelectElement>('#notebook')!;
  const confirm = document.querySelector<HTMLButtonElement>('#confirm')!;
  let notebooks: Notebook[] = [];

  async function loadNotebooks() {
    addButton.disabled = true;
    form.hidden = true;
    showStatus('Cargando cuadernos…', 'info');
    try {
      // Se piden cada vez, para reflejar el estado actual de NotebookLM (RF-09).
      const response: ListNotebooksResponse = await browser.runtime.sendMessage({ type: LIST_NOTEBOOKS });
      if (!response.ok) return showStatus(response.message);
      notebooks = response.notebooks;
      if (!notebooks.length) return showStatus(NO_NOTEBOOKS);
      await fillSelect(select, notebooks);
      confirm.disabled = !select.value;
      form.hidden = false;
      showStatus('');
    } catch (error) {
      showStatus(error instanceof Error ? error.message : String(error));
    } finally {
      addButton.disabled = false;
    }
  }

  async function addToSelected() {
    const notebook = notebooks.find((n) => n.id === select.value);
    if (!notebook) return;
    confirm.disabled = addButton.disabled = true;
    showStatus(target.kind === 'video' ? 'Añadiendo el vídeo…' : 'Añadiendo los vídeos de la lista…', 'info');
    try {
      const request: AddToNotebookRequest = { type: ADD_TO_NOTEBOOK, notebook, target };
      const response: AddToNotebookResponse = await browser.runtime.sendMessage(request);
      if (response.addedAny) await browser.storage.local.set({ [LAST_NOTEBOOK_KEY]: notebook.id });
      showStatus(response.message, response.ok ? 'success' : 'error');
    } catch (error) {
      showStatus(error instanceof Error ? error.message : String(error));
    } finally {
      confirm.disabled = addButton.disabled = false;
    }
  }

  addButton.addEventListener('click', () => void loadNotebooks());

  select.addEventListener('change', () => {
    confirm.disabled = !select.value;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void addToSelected();
  });
}

/** Rellena el desplegable y preselecciona el último cuaderno usado si sigue existiendo (RF-04, CB-05). */
async function fillSelect(select: HTMLSelectElement, notebooks: Notebook[]) {
  const last = (await browser.storage.local.get(LAST_NOTEBOOK_KEY))[LAST_NOTEBOOK_KEY];
  const placeholder = new Option('Elige un cuaderno…', '');
  placeholder.disabled = true;
  select.replaceChildren(placeholder, ...notebooks.map((n) => new Option(n.title, n.id)));
  select.value = notebooks.some((n) => n.id === last) ? (last as string) : '';
}
